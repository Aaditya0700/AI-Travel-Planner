import { Type } from '@google/genai';
import {
  GeminiNotConfiguredError,
  getGeminiClient,
  getGeminiModel,
} from '../config/gemini.js';
import { buildDateList, buildItineraryPrompt } from './itineraryPrompt.js';

// A single generation should not hold a request open for long.
const REQUEST_TIMEOUT_MS = 45000;
// Two attempts in total, which is one conservative retry.
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 600;

// Only these are worth a second try. A bad key or a bad request is not.
const TRANSIENT_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);
const TRANSIENT_MESSAGE =
  /timeout|timed out|ETIMEDOUT|ECONNRESET|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|fetch failed|network|socket hang up|unavailable|overloaded|503/i;

// The structured output schema handed to Gemini. The server validates the
// answer again afterwards, because a schema is a request, not a guarantee.
const activitySchema = {
  type: Type.OBJECT,
  properties: {
    time: {
      type: Type.STRING,
      description: 'Start time of the activity in 24 hour HH:MM format.',
    },
    title: { type: Type.STRING, description: 'Short name of the activity.' },
    description: {
      type: Type.STRING,
      description: 'One or two sentences describing what to do.',
    },
  },
  required: ['time', 'title', 'description'],
};

export const itineraryResponseSchema = {
  type: Type.OBJECT,
  properties: {
    days: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.INTEGER, description: 'Day number starting at 1.' },
          date: {
            type: Type.STRING,
            description: 'Calendar date for this day in YYYY-MM-DD format.',
          },
          title: { type: Type.STRING, description: 'Short title for the day.' },
          activities: { type: Type.ARRAY, items: activitySchema },
        },
        required: ['day', 'date', 'title', 'activities'],
      },
    },
  },
  required: ['days'],
};

// Anything wrong with Gemini's answer, or with reaching Gemini, becomes one of
// these. The message is only ever logged, never sent to the client.
export class GeminiServiceError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'GeminiServiceError';
    this.code = code;
  }
}

function isMissingKey(error) {
  return error instanceof GeminiNotConfiguredError;
}

function isMissingModel() {
  return !getGeminiModel();
}

function readStatus(error) {
  const status = error?.status ?? error?.response?.status ?? error?.code;

  return typeof status === 'number' ? status : null;
}

// True only for failures that may succeed on a second attempt.
function isTransient(error) {
  if (isMissingKey(error) || isMissingModel()) {
    return false;
  }

  const status = readStatus(error);

  if (status !== null) {
    return TRANSIENT_STATUS_CODES.has(status);
  }

  return TRANSIENT_MESSAGE.test(error?.message || '');
}

function formatError(error) {
  const status = readStatus(error);
  const message = error?.message || String(error);
  const name = error?.name || 'Error';
  const details = status !== null ? ` (status: ${status})` : '';
  return `${name}: ${message}${details}`;
}

// Anything the model returns is treated as untrusted input until validated.
function readText(response) {
  const text = response?.text;

  if (typeof text !== 'string' || !text.trim()) {
    throw new GeminiServiceError('Gemini returned an empty response', 'AI_INVALID_RESPONSE');
  }

  return text;
}

function readRequiredString(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new GeminiServiceError(`Gemini response is missing ${field}`, 'AI_INVALID_RESPONSE');
  }

  return value.trim();
}

function validateDays(parsed, numberOfDays, expectedDates) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new GeminiServiceError('Gemini response was not an object', 'AI_INVALID_RESPONSE');
  }

  if (!Array.isArray(parsed.days)) {
    throw new GeminiServiceError('Gemini response had no days array', 'AI_INVALID_RESPONSE');
  }

  if (parsed.days.length !== numberOfDays) {
    throw new GeminiServiceError(
      `Gemini returned ${parsed.days.length} days instead of ${numberOfDays}`,
      'AI_INVALID_RESPONSE'
    );
  }

  return parsed.days.map((day, index) => {
    const expectedDay = index + 1;
    const dayNumber = Number(day?.day);

    if (!Number.isInteger(dayNumber) || dayNumber !== expectedDay) {
      throw new GeminiServiceError(
        `Gemini day ${expectedDay} was out of order`,
        'AI_INVALID_RESPONSE'
      );
    }

    const date = readRequiredString(day?.date, 'a day date');

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new GeminiServiceError('Gemini returned a malformed date', 'AI_INVALID_RESPONSE');
    }

    // The trip's own dates are worked out on the server, so a day that lands on
    // a different date means the model invented one.
    if (Array.isArray(expectedDates) && expectedDates[index] && date !== expectedDates[index]) {
      throw new GeminiServiceError(
        `Gemini put day ${expectedDay} on the wrong date`,
        'AI_INVALID_RESPONSE'
      );
    }

    const title = readRequiredString(day?.title, 'a day title');

    if (!Array.isArray(day?.activities) || day.activities.length === 0) {
      throw new GeminiServiceError('Gemini returned a day with no activities', 'AI_INVALID_RESPONSE');
    }

    const activities = day.activities.map((activity) => ({
      time: readRequiredString(activity?.time, 'an activity time'),
      title: readRequiredString(activity?.title, 'an activity title'),
      description: readRequiredString(activity?.description, 'an activity description'),
    }));

    return { day: dayNumber, date, title, activities };
  });
}

export function parseAndValidateItinerary(text, numberOfDays, expectedDates) {
  let parsed;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new GeminiServiceError('Gemini response was not valid JSON', 'AI_INVALID_RESPONSE');
  }

  return validateDays(parsed, numberOfDays, expectedDates);
}

// Generates a day by day plan for a trip and returns only the validated days.
// Throws GeminiNotConfiguredError when the server has no key, and
// GeminiServiceError for anything else that goes wrong.
export async function generateItineraryDays(trip, numberOfDays) {
  if (isMissingModel()) {
    throw new GeminiNotConfiguredError('GEMINI_MODEL is not set on the server');
  }

  // Throws when GEMINI_API_KEY is missing, so the server fails clearly here
  // instead of at import time.
  const client = getGeminiClient();
  const model = getGeminiModel();
  const { systemInstruction, userPrompt } = buildItineraryPrompt(trip, numberOfDays);
  const expectedDates = buildDateList(trip.startDate, numberOfDays);

  let lastError = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        config: {
          systemInstruction: { text: systemInstruction },
          temperature: 0.4,
          // Ask for JSON through the SDK's structured output support rather
          // than only asking for it in the prompt.
          responseMimeType: 'application/json',
          responseSchema: itineraryResponseSchema,
          httpOptions: {
            timeout: REQUEST_TIMEOUT_MS,
            // The SDK retries up to five times by default. Turning that off
            // here keeps the total at MAX_ATTEMPTS.
            retryOptions: { attempts: 1 },
          },
        },
      });

      return parseAndValidateItinerary(readText(response), numberOfDays, expectedDates);
    } catch (error) {
      lastError = error;

      if (isMissingKey(error)) {
        throw error;
      }

      if (attempt === MAX_ATTEMPTS || !isTransient(error)) {
        break;
      }

      await new Promise((resolve) => {
        setTimeout(resolve, RETRY_DELAY_MS);
      });
    }
  }

  if (lastError instanceof GeminiServiceError) {
    throw lastError;
  }

  console.error('[itinerary] AI request failed:', formatError(lastError));
  throw new GeminiServiceError(
    `Gemini request failed (${formatError(lastError)})`,
    'AI_UNAVAILABLE'
  );
}

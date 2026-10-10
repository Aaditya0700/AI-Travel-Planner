// Chat service using the existing Gemini configuration.
// Reuses the same client, model, and error handling patterns as the itinerary generator.

import {
  GeminiNotConfiguredError,
  getGeminiClient,
  getGeminiModel,
  isGeminiConfigured,
} from '../config/gemini.js';
import { buildChatPrompt, validateMessage } from './chatPrompt.js';

const REQUEST_TIMEOUT_MS = 30000;
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 500;

const TRANSIENT_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);
const TRANSIENT_MESSAGE =
  /timeout|timed out|ETIMEDOUT|ECONNRESET|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|fetch failed|network|socket hang up|unavailable|overloaded|503/i;

export class GeminiChatError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'GeminiChatError';
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

function isTimeoutError(error) {
  const status = readStatus(error);
  const details = [error?.code, error?.name, error?.message].filter(Boolean).join(' ');

  return status === 408 || status === 504 ||
    /deadline.?exceeded|timeout|timed out|ETIMEDOUT|ECONNABORTED|AbortError/i.test(details);
}

function isQuotaError(error) {
  const status = readStatus(error);
  if (status !== null) {
    return status === 429;
  }
  return /resource.?exhausted|quota/i.test(error?.message || '');
}

function formatError(error) {
  const status = readStatus(error);
  const message = error?.message || String(error);
  const name = error?.name || 'Error';
  const details = status !== null ? ` (status: ${status})` : '';
  return `${name}: ${message}${details}`;
}

function readText(response) {
  const text = response?.text;

  if (typeof text !== 'string' || !text.trim()) {
    throw new GeminiChatError('Gemini returned an empty response', 'AI_INVALID_RESPONSE');
  }

  return text.trim();
}

export async function sendChatMessage(trip, expenses, itinerary, history, userMessage) {
  if (!isGeminiConfigured()) {
    throw new GeminiNotConfiguredError('Gemini is not configured on this server');
  }

  if (isMissingModel()) {
    throw new GeminiNotConfiguredError('GEMINI_MODEL is not set on the server');
  }

  const validationError = validateMessage(userMessage);
  if (validationError) {
    throw new GeminiChatError(validationError, 'INVALID_MESSAGE');
  }

  const client = getGeminiClient();
  const model = getGeminiModel();
  const { systemInstruction, userPrompt } = buildChatPrompt(trip, expenses, itinerary, history, userMessage);

  let lastError = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        config: {
          systemInstruction: { text: systemInstruction },
          temperature: 0.5,
          httpOptions: {
            timeout: REQUEST_TIMEOUT_MS,
            retryOptions: { attempts: 1 },
          },
        },
      });

      return readText(response);
    } catch (error) {
      lastError = error;

      if (isMissingKey(error)) {
        throw error;
      }

      if (isQuotaError(error)) {
        throw new GeminiChatError('AI usage limit reached. Please try again later.', 'AI_QUOTA_EXCEEDED');
      }

      if (isTimeoutError(error) || attempt === MAX_ATTEMPTS || !isTransient(error)) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }

  if (lastError instanceof GeminiChatError) {
    throw lastError;
  }

  console.error('[chat] AI request failed:', formatError(lastError));
  throw new GeminiChatError(
    `Gemini request failed (${formatError(lastError)})`,
    'AI_UNAVAILABLE'
  );
}

// Budget planner service using the existing Gemini configuration.
// Reuses the same client, model, and error handling patterns as the itinerary generator.

import {
  GeminiNotConfiguredError,
  getGeminiClient,
  getGeminiModel,
  isGeminiConfigured,
} from '../config/gemini.js';
import { buildBudgetPrompt, budgetResponseSchema } from './budgetPrompt.js';

const REQUEST_TIMEOUT_MS = 30000;
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 500;

const TRANSIENT_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);
const TRANSIENT_MESSAGE =
  /timeout|timed out|ETIMEDOUT|ECONNRESET|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|fetch failed|network|socket hang up|unavailable|overloaded|503/i;

export class GeminiBudgetError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'GeminiBudgetError';
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
    throw new GeminiBudgetError('Gemini returned an empty response', 'AI_INVALID_RESPONSE');
  }

  return text.trim();
}

function parseBudgetResponse(text) {
  let parsed;

  // Handle JSON inside markdown code fences
  const codeFenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const jsonText = codeFenceMatch ? codeFenceMatch[1].trim() : text.trim();

  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new GeminiBudgetError('Gemini response was not valid JSON', 'AI_INVALID_RESPONSE');
  }

  // Validate required fields
  const requiredFields = ['summary', 'currency', 'budget', 'estimatedTotal', 'estimatedRemaining', 'categories', 'savingTips', 'warnings'];
  for (const field of requiredFields) {
    if (!(field in parsed)) {
      throw new GeminiBudgetError(`Gemini response is missing required field: ${field}`, 'AI_INVALID_RESPONSE');
    }
  }

  // Validate numeric fields
  if (typeof parsed.budget !== 'number' || Number.isNaN(parsed.budget)) {
    throw new GeminiBudgetError('Invalid budget value', 'AI_INVALID_RESPONSE');
  }
  if (typeof parsed.estimatedTotal !== 'number' || Number.isNaN(parsed.estimatedTotal)) {
    throw new GeminiBudgetError('Invalid estimatedTotal value', 'AI_INVALID_RESPONSE');
  }
  if (typeof parsed.estimatedRemaining !== 'number' || Number.isNaN(parsed.estimatedRemaining)) {
    throw new GeminiBudgetError('Invalid estimatedRemaining value', 'AI_INVALID_RESPONSE');
  }

  // Validate categories array
  if (!Array.isArray(parsed.categories)) {
    throw new GeminiBudgetError('Categories must be an array', 'AI_INVALID_RESPONSE');
  }

  for (const cat of parsed.categories) {
    if (!cat.name || typeof cat.amount !== 'number' || typeof cat.percentage !== 'number' || !cat.reason) {
      throw new GeminiBudgetError('Invalid category structure', 'AI_INVALID_RESPONSE');
    }
    if (cat.amount < 0 || cat.percentage < 0) {
      throw new GeminiBudgetError('Category amounts and percentages must be non-negative', 'AI_INVALID_RESPONSE');
    }
  }

  // Validate savingTips and warnings arrays
  if (!Array.isArray(parsed.savingTips)) {
    throw new GeminiBudgetError('savingTips must be an array', 'AI_INVALID_RESPONSE');
  }
  if (!Array.isArray(parsed.warnings)) {
    throw new GeminiBudgetError('warnings must be an array', 'AI_INVALID_RESPONSE');
  }

  return parsed;
}

export async function generateBudgetPlan(trip, expenses) {
  if (!isGeminiConfigured()) {
    throw new GeminiNotConfiguredError('Gemini is not configured on this server');
  }

  if (isMissingModel()) {
    throw new GeminiNotConfiguredError('GEMINI_MODEL is not set on the server');
  }

  const client = getGeminiClient();
  const model = getGeminiModel();
  const { systemInstruction, userPrompt } = buildBudgetPrompt(trip, expenses);

  let lastError = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        config: {
          systemInstruction: { text: systemInstruction },
          temperature: 0.4,
          responseMimeType: 'application/json',
          responseSchema: budgetResponseSchema,
          httpOptions: {
            timeout: REQUEST_TIMEOUT_MS,
            retryOptions: { attempts: 1 },
          },
        },
      });

      return parseBudgetResponse(readText(response));
    } catch (error) {
      lastError = error;

      if (isMissingKey(error)) {
        throw error;
      }

      if (attempt === MAX_ATTEMPTS || !isTransient(error)) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }

  if (lastError instanceof GeminiBudgetError) {
    throw lastError;
  }

  console.error('[budget] AI request failed:', formatError(lastError));
  throw new GeminiBudgetError(
    `Gemini request failed (${formatError(lastError)})`,
    'AI_UNAVAILABLE'
  );
}
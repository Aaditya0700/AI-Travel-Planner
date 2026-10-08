// Photo guide service using Gemini Vision.
// Reuses the same client, model, and error handling patterns as other AI services.

import {
  GeminiNotConfiguredError,
  getGeminiClient,
  getGeminiModel,
  isGeminiConfigured,
} from '../config/gemini.js';
import { buildPhotoGuidePrompt, parseAndValidatePhotoGuide } from './photoPrompt.js';

const REQUEST_TIMEOUT_MS = 120000;
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 600;

const TRANSIENT_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);
const AUTH_STATUS_CODES = new Set([401, 403]);
const TRANSIENT_MESSAGE =
  /timeout|timed out|ETIMEDOUT|ECONNRESET|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|fetch failed|network|socket hang up|unavailable|overloaded|503|deadline.?exceeded/i;
const AUTH_MESSAGE = /invalid.*key|unauthorized|authentication|permission denied|forbidden|api.?key/i;

export class GeminiPhotoError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'GeminiPhotoError';
    this.code = code;
  }
}

function isMissingKey(error) {
  return error instanceof GeminiNotConfiguredError;
}

function isAuthError(error) {
  const status = readStatus(error);
  if (status !== null) {
    return AUTH_STATUS_CODES.has(status);
  }
  return AUTH_MESSAGE.test(error?.message || '');
}

function isDeadlineExceeded(error) {
  const status = readStatus(error);
  if (status !== null) {
    return status === 504;
  }
  return /deadline.?exceeded/i.test(error?.message || '');
}

function formatError(error) {
  const status = readStatus(error);
  const message = error?.message || String(error);
  const name = error?.name || 'Error';
  const details = status !== null ? ` (status: ${status})` : '';
  return `${name}: ${message}${details}`;
}

// Free-tier Gemini keys enforce a per-day generate quota. Once it is spent
// every request returns 429 RESOURCE_EXHAUSTED, which retrying cannot fix.
function isQuotaError(error) {
  const status = readStatus(error);
  if (status !== null) {
    return status === 429;
  }
  return /quota|resource.?exhausted/i.test(error?.message || '');
}

function isMissingModel() {
  return !getGeminiModel();
}

function readStatus(error) {
  const status = error?.status ?? error?.response?.status ?? error?.code;
  return typeof status === 'number' ? status : null;
}

function isTransient(error) {
  if (isMissingKey(error) || isMissingModel() || isAuthError(error) || isDeadlineExceeded(error)) {
    return false;
  }

  const status = readStatus(error);
  if (status !== null) {
    return TRANSIENT_STATUS_CODES.has(status);
  }

  return TRANSIENT_MESSAGE.test(error?.message || '');
}

function readText(response) {
  const text = response?.text;
  if (typeof text !== 'string' || !text.trim()) {
    throw new GeminiPhotoError('Gemini returned an empty response', 'AI_INVALID_RESPONSE');
  }
  return text.trim();
}

export async function generatePhotoGuide(base64Image, mimeType, language = 'English') {
  if (!isGeminiConfigured()) {
    throw new GeminiNotConfiguredError('Gemini is not configured on this server');
  }

  if (isMissingModel()) {
    throw new GeminiNotConfiguredError('GEMINI_MODEL is not set on the server');
  }

  const client = getGeminiClient();
  const model = getGeminiModel();
  const { systemInstruction, userPrompt } = buildPhotoGuidePrompt(language);

  // Detailed logging
  const base64SizeKB = Math.round(base64Image.length / 1024);
  const approxBytesKB = Math.round((base64Image.length * 3) / 4 / 1024);
  console.log(`[geminiPhoto] Starting request: model=${model}, mimeType=${mimeType}, language=${language}, base64Size=${base64SizeKB}KB, approxBinarySize=${approxBytesKB}KB`);

  let lastError = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const attemptStart = Date.now();
    try {
      const response = await client.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              { text: userPrompt },
              {
                inlineData: {
                  mimeType,
                  data: base64Image,
                },
              },
            ],
          },
        ],
        config: {
          systemInstruction: { text: systemInstruction },
          temperature: 0.4,
          httpOptions: {
            timeout: REQUEST_TIMEOUT_MS,
            retryOptions: { attempts: 1 },
          },
        },
      });

      const attemptElapsed = Date.now() - attemptStart;
      console.log(`[geminiPhoto] Attempt ${attempt} completed in ${attemptElapsed}ms`);

      const text = readText(response);
      return parseAndValidatePhotoGuide(text);
    } catch (error) {
      lastError = error;

      if (isMissingKey(error)) {
        throw error;
      }

      if (isAuthError(error)) {
        console.error('[geminiPhoto] Authentication failed - check GEMINI_API_KEY:', error.message);
        throw new GeminiPhotoError('Invalid or missing Gemini API key', 'GEMINI_AUTH_ERROR');
      }

      if (isQuotaError(error)) {
        console.error('[geminiPhoto] Gemini usage quota exceeded:', String(error.message).slice(0, 300));
        throw new GeminiPhotoError('The AI service has reached its usage limit for now. Please try again later.', 'GEMINI_QUOTA_EXCEEDED');
      }

      if (isDeadlineExceeded(error)) {
        console.error('[geminiPhoto] Request timed out (DEADLINE_EXCEEDED):', error.message);
        throw new GeminiPhotoError('The AI service took too long to respond. Please try again.', 'DEADLINE_EXCEEDED');
      }

      if (attempt === MAX_ATTEMPTS || !isTransient(error)) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }

  if (lastError instanceof GeminiPhotoError) {
    throw lastError;
  }

  console.error('[geminiPhoto] Request failed:', formatError(lastError));
  throw new GeminiPhotoError(
    `Gemini request failed (${formatError(lastError)})`,
    'AI_UNAVAILABLE'
  );
}
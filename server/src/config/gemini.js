import { GoogleGenAI } from '@google/genai';

// The environment is read on every call instead of once at import time, so the
// module behaves the same whether dotenv has finished loading or not. Nothing
// in here is ever returned to a client or written to a log.
export function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY || '';
}

// The model name is configuration, not application logic, so it is never
// hardcoded in the routes or the prompt builder.
export function getGeminiModel() {
  return process.env.GEMINI_MODEL || '';
}

export function isGeminiConfigured() {
  return Boolean(getGeminiApiKey() && getGeminiModel());
}

// Raised when the AI feature is used on a server that has no key configured.
export class GeminiNotConfiguredError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GeminiNotConfiguredError';
    this.code = 'GEMINI_NOT_CONFIGURED';
  }
}

let cachedClient = null;

// The client is built lazily and cached. A missing key fails here, which only
// happens when the AI feature is actually used, so /health and every other
// route keep working on a server without an AI key.
export function getGeminiClient() {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new GeminiNotConfiguredError('Gemini is not configured on this server');
  }

  if (!cachedClient) {
    cachedClient = new GoogleGenAI({ apiKey });
  }

  return cachedClient;
}

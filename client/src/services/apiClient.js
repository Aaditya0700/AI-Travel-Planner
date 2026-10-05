// One place for every request to the backend.
//
// The browser never sees the Gemini API key. It only ever talks to our own
// Express server, which is the only thing that holds that key.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5100';

const TOKEN_KEY = 'aiTravelPlanner.token';

// The JWT is kept in localStorage so a page refresh keeps the user logged in.
// It is a token the user already has; no secret is written here.
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// Turns a failed response into a normal Error with a message that is safe to
// show on screen. Stack traces and raw bodies are never passed through.
export class ApiError extends Error {
  constructor(message, status, details = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const token = getToken();
  const headers = { Accept: 'application/json' };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // fetch only rejects when the request never reached the server.
    throw new ApiError('Could not reach the server. Check your connection and try again.', 0);
  }

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new ApiError(
      data?.error || 'Something went wrong. Please try again.',
      response.status,
      Array.isArray(data?.details) ? data.details : [],
    );
  }

  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
};

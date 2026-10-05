import { api } from './apiClient.js';

// Matches the routes in server/src/routes/auth.js.
export const authService = {
  async register({ name, email, password }) {
    return api.post('/api/v1/auth/register', { name, email, password });
  },

  async login({ email, password }) {
    return api.post('/api/v1/auth/login', { email, password });
  },

  // Used on page load to check a stored token is still valid.
  async me() {
    return api.get('/api/v1/auth/me');
  },
};

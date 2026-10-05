import { useCallback, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService.js';
import { clearToken, getToken, setToken } from '../services/apiClient.js';
import { AuthContext } from './useAuth.js';

// One context holds "who is logged in". Keeping it in a context means the
// header, the protected routes and every page all read the same state
// instead of each one fetching the user again.

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // 'loading' stops the app from flashing the login page during the first
  // render, before the stored token has been checked.
  const [status, setStatus] = useState('loading');

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setStatus('signed-out');
  }, []);

  // On refresh the token is still in localStorage, so ask the backend who it
  // belongs to. A token that expired in the meantime gets thrown away here.
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      if (!getToken()) {
        setStatus('signed-out');
        return;
      }

      try {
        const data = await authService.me();

        if (!cancelled) {
          setUser(data.user);
          setStatus('signed-in');
        }
      } catch {
        if (!cancelled) {
          clearToken();
          setUser(null);
          setStatus('signed-out');
        }
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await authService.login(credentials);

    setToken(data.token);
    setUser(data.user);
    setStatus('signed-in');

    return data.user;
  }, []);

  // Registering does not return a token, so log the new user straight in.
  const register = useCallback(
    async (details) => {
      await authService.register(details);

      return login({ email: details.email, password: details.password });
    },
    [login],
  );

  // Any request that comes back 401 means the token is gone or expired.
  // Clear it once, centrally, instead of in every page.
  const handleUnauthorized = useCallback(() => {
    clearToken();
    setUser(null);
    setStatus('signed-out');
  }, []);

  const value = useMemo(
    () => ({ user, status, login, register, logout, handleUnauthorized }),
    [user, status, login, register, logout, handleUnauthorized],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

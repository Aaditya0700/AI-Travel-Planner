import { createContext, useContext } from 'react';

// The context object and its hook live apart from AuthProvider, so the
// provider file only exports a component.

export const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }

  return context;
}

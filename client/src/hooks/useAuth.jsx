import { createContext, useContext, useEffect, useState } from 'react';
import { api, setToken } from '../lib/api.js';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('hpw_token')) {
      setLoading(false);
      return;
    }
    api.me().then(r => {
      setUser(r.user);
    }).catch(() => {
      setToken(null);
    }).finally(() => setLoading(false));
  }, []);

  const value = {
    user,
    setUser,
    loading,
    async register(data) {
      const r = await api.register(data);
      setToken(r.token);
      setUser(r.user);
      return r;
    },
    async login(data) {
      const r = await api.login(data);
      setToken(r.token);
      setUser(r.user);
      return r;
    },
    async logout() {
      try { await api.logout(); } catch {}
      setToken(null);
      setUser(null);
    }
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}

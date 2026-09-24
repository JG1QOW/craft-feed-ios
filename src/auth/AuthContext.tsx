import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ApiError, account, auth, setUnauthorizedHandler } from '../api/client';
import type { User } from '../api/types';
import { tokenStorage } from './tokenStorage';

interface AuthState {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(async () => {
    setToken(null);
    setUser(null);
    await tokenStorage.clear();
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void clearSession();
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  useEffect(() => {
    (async () => {
      try {
        const stored = await tokenStorage.get();
        if (stored) {
          const me = await auth.me(stored);
          setToken(stored);
          setUser(me);
        }
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          await tokenStorage.clear();
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const applySession = useCallback(async (newToken: string, newUser: User) => {
    await tokenStorage.set(newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await auth.login(email, password);
      await applySession(res.token, res.user);
    },
    [applySession],
  );

  const register = useCallback(
    async (name: string, email: string, password: string, passwordConfirmation: string) => {
      const res = await auth.register(name, email, password, passwordConfirmation);
      await applySession(res.token, res.user);
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    if (token) {
      try {
        await auth.logout(token);
      } catch {
        // Token may already be invalid; clear locally regardless.
      }
    }
    await clearSession();
  }, [token, clearSession]);

  const deleteAccount = useCallback(
    async (password: string) => {
      if (!token) return;
      await account.destroy(token, password);
      await clearSession();
    },
    [token, clearSession],
  );

  const refreshUser = useCallback(async () => {
    if (!token) return;
    setUser(await auth.me(token));
  }, [token]);

  const value = useMemo<AuthState>(
    () => ({ token, user, loading, login, register, logout, deleteAccount, refreshUser, setUser }),
    [token, user, loading, login, register, logout, deleteAccount, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

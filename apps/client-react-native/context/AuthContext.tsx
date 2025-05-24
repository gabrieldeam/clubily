// src/context/AuthContext.tsx
import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getCurrentUser,
  logoutUser as logoutService,
} from '../services/userService';
import api from '../services/api';
import type { UserRead } from '../types/user';

interface AuthContextType {
  user: UserRead | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
  logout: async () => {},
  isAdmin: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserRead | null>(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === 'admin';

  /* ---------------------------------------------------- */
  // 1) Coloca token do AsyncStorage (se existir) no header
  const hydrateToken = async () => {
    const saved = await AsyncStorage.getItem('jwt');
    if (saved) {
      api.defaults.headers.common.Authorization = `Bearer ${saved}`;
    }
  };

  /* ---------------------------------------------------- */
  // 2) Busca usuário ou zera caso token inválido
  const refreshUser = async () => {
    setLoading(true);
    try {
      const res = await getCurrentUser();
      setUser(res.data);
    } catch {
      setUser(null);
      await AsyncStorage.removeItem('jwt');
      delete api.defaults.headers.common.Authorization;
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------- */
  const logout = async () => {
    await logoutService(); // já remove token + header
    setUser(null);
  };

  /* ---------------------------------------------------- */
  useEffect(() => {
    (async () => {
      await hydrateToken();
      await refreshUser();
    })();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, refreshUser, logout, isAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

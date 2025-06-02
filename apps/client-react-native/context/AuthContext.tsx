// src/context/AuthContext.tsx
import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import api from '../services/api';
import {
  getCurrentUser,
  logoutUser as logoutService,
} from '../services/userService';
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

  // 1) Hidrata token no header do axios (se existir)
  const hydrateToken = async () => {
    const saved = await AsyncStorage.getItem('jwt');
    if (saved) {
      api.defaults.headers.common.Authorization = `Bearer ${saved}`;
    }
  };

  // 2) Busca /users/me ou zera user
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

  // 3) Logout manual: remove token e seta user=null
  const logout = async () => {
    await logoutService(); // removeItem('jwt') + limpa header
    setUser(null);
    // NOTA: refreshUser não é obrigatório aqui, pois o interceptor
    // cuidará de qualquer chamada subsequente que resulte em 401.
  };

  // 4) Montagem inicial: hidrata e já faz refresh do usuário
  useEffect(() => {
    (async () => {
      await hydrateToken();
      await refreshUser();
    })();

    // 4a) Intercepta respostas 401 em qualquer chamada feita por `api`
    const interceptorId = api.interceptors.response.use(
      response => response,
      async error => {
        if (error.response?.status === 401) {
          // Token expirou ou inválido: forçar logout
          await logoutService(); // removeItem + limpa header
          setUser(null);
        }
        return Promise.reject(error);
      }
    );

    // 4b) Quando o app volta do background para foreground, tenta revalidar token
    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') {
        // Ao voltar a ficar ativo, revalida /users/me
        refreshUser();
      }
    });

    return () => {
      api.interceptors.response.eject(interceptorId);
      subscription.remove();
    };
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

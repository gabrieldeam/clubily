// src/context/AuthContext.tsx
'use client';

import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
} from 'react';
import { useRouter } from 'next/navigation';                // ⬅️ IMPORT
import api from '@/services/api';                            // ⬅️ IMPORT do axios instance
import {
  getCurrentUser,
  logoutUser,
} from '@/services/userService';
import type { UserRead } from '@/types/user';

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
  const router = useRouter(); // ⬅️ instanciando o roteador

  // Função para buscar dados do usuário atual
  const refreshUser = async () => {
    setLoading(true);
    try {
      const res = await getCurrentUser();
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Função de logout → desloga e redireciona
  const logout = async () => {
    try {
      await logoutUser();
    } catch {
      // se der erro no logout, ignoramos
    } finally {
      setUser(null);
      // redireciona para “/” e recarrega a página
      router.push('/');
      window.location.reload();
    }
  };

  // Ao montar o contexto, buscamos o usuário e criamos o interceptor de 401
  useEffect(() => {
    // 1) Primeiro, carregamos o usuário
    refreshUser();

    // 2) Criamos um interceptor global de respostas do axios
    //    sempre que receber status 401, redireciona p/ “/” e faz reload.
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // limpa estado local (caso queira forçar logout no contexto também)
          setUser(null);
          // redireciona para root e recarrega
          router.push('/');
          window.location.reload();
        }
        return Promise.reject(error);
      }
    );

    // 3) Ao desmontar o contexto, removemos o interceptor
    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [router]);

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

'use client';

import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
} from 'react';
import { getCurrentCompany } from '@/services/companyService';
import type { CompanyRead } from '@/types/company';

interface AuthContextType {
  /** Dados da empresa logada (ou null) */
  user: CompanyRead | null;
  /** Indica se ainda está checando o login */
  loading: boolean;
  /** Recarrega o usuário chamando GET /companies/me */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CompanyRead | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    setLoading(true);
    try {
      const res = await getCurrentCompany();
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook para usar em qualquer componente */
export function useAuth() {
  return useContext(AuthContext);
}

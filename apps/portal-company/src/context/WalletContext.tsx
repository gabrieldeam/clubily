// src/context/WalletContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getWallet } from '@/services/walletService';
import { useAuth } from './AuthContext';  // 👈 importe o hook de autenticação

interface WalletContextData {
  balance: number;
  loading: boolean;
  refresh: () => void;
}

const WalletContext = createContext<WalletContextData | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth(); // 👈 obtém user e loading da auth
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  async function loadWallet() {
    setLoading(true);
    try {
      const res = await getWallet();
      setBalance(Number(res.data.balance));
    } catch {
      setBalance(0);
    } finally {
      setLoading(false);
    }
  }

  // Chama a primeira vez (por ex., se o usuário já estiver logado ao recarregar a página)
  useEffect(() => {
    loadWallet();
  }, []);

  // Recarrega sempre que o usuário efetuar login (user deixa de ser null)
  useEffect(() => {
    if (!authLoading && user) {
      loadWallet();
    }
  }, [authLoading, user]);

  return (
    <WalletContext.Provider value={{ balance, loading, refresh: loadWallet }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be inside WalletProvider');
  return ctx;
};

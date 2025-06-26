// src/context/WalletContext.tsx
'use client';                // ← certifique-se de que isso está aqui

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getWallet } from '@/services/walletService';

interface WalletContextData {
  balance: number;
  loading: boolean;
  refresh: () => void;
}

const WalletContext = createContext<WalletContextData | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
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

  useEffect(() => {
    loadWallet();
  }, []);

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

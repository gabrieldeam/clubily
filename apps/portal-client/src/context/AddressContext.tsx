'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import type { AddressRead } from '@/types/address';

interface AddressContextValue {
  selectedAddress: AddressRead | null;
  setSelectedAddress: (addr: AddressRead) => void;
}

const AddressContext = createContext<AddressContextValue | undefined>(undefined);

export function AddressProvider({ children }: { children: ReactNode }) {
  const [selectedAddress, setSelectedAddress] = useState<AddressRead | null>(null);

  return (
    <AddressContext.Provider value={{ selectedAddress, setSelectedAddress }}>
      {children}
    </AddressContext.Provider>
  );
}

export function useAddress() {
  const ctx = useContext(AddressContext);
  if (!ctx) throw new Error('useAddress deve ser usado dentro de AddressProvider');
  return ctx;
}

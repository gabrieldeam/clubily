// src/context/AddressContext.tsx
'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import type { AddressRead } from '@/types/address';
import { getAddressById } from '@/services/addressService';

export type FilterField = 'city' | 'street' | 'postal_code' | 'country';

interface AddressContextValue {
  selectedAddress: AddressRead | null;
  setSelectedAddress: (addr: AddressRead | null) => void;
  filterField: FilterField;
  setFilterField: (field: FilterField) => void;
}

const AddressContext = createContext<AddressContextValue | undefined>(undefined);

export function AddressProvider({ children }: { children: ReactNode }) {
  const [selectedAddress, setSelectedAddressState] = useState<AddressRead | null>(null);
  const [filterField, setFilterFieldState] = useState<FilterField>('city');

  // 1. Na montagem, reidrata o filterField
  useEffect(() => {
    const storedField = localStorage.getItem('addressFilterField') as FilterField | null;
    if (storedField) setFilterFieldState(storedField);
  }, []);

  // 2. Na montagem, reidrata o selectedAddress via ID
  useEffect(() => {
    const storedId = localStorage.getItem('selectedAddressId');
    if (!storedId) return;

    getAddressById(storedId)
      .then(res => setSelectedAddressState(res.data))
      .catch(() => {
        // Se não existir mais, limpa
        localStorage.removeItem('selectedAddressId');
        setSelectedAddressState(null);
      });
  }, []);

  // 3. Função que atualiza + persiste o selectedAddress
  const setSelectedAddress = (addr: AddressRead | null) => {
    setSelectedAddressState(addr);
    if (addr) {
      localStorage.setItem('selectedAddressId', addr.id);
    } else {
      localStorage.removeItem('selectedAddressId');
    }
  };

  // 4. Função que atualiza + persiste o filterField
  const setFilterField = (field: FilterField) => {
    setFilterFieldState(field);
    localStorage.setItem('addressFilterField', field);
  };

  return (
    <AddressContext.Provider
      value={{
        selectedAddress,
        setSelectedAddress,
        filterField,
        setFilterField,
      }}
    >
      {children}
    </AddressContext.Provider>
  );
}

export function useAddress() {
  const ctx = useContext(AddressContext);
  if (!ctx) throw new Error('useAddress deve ser usado dentro de AddressProvider');
  return ctx;
}

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
import { listAddresses, updateAddress } from '@/services/addressService';

interface AddressContextValue {
  selectedAddress: AddressRead | null;
  setSelectedAddress: (addr: AddressRead | null) => void;
  filterField: FilterField;
  setFilterField: (field: FilterField) => void;
}

export type FilterField = 'city' | 'street' | 'postal_code' | 'country';

const AddressContext = createContext<AddressContextValue | undefined>(undefined);

export function AddressProvider({ children }: { children: ReactNode }) {
  const [selectedAddress, setSelectedAddressState] = useState<AddressRead | null>(null);
  const [filterField, setFilterFieldState] = useState<FilterField>('city');

  // 1. On mount, load all addresses and pick the one with is_selected = true.
  //    If none is selected, pick the first, mark it as selected on the server, and store it.
  useEffect(() => {
    async function initializeSelection() {
      try {
        const res = await listAddresses();
        const allAddresses: AddressRead[] = res.data;

        if (allAddresses.length === 0) {
          setSelectedAddressState(null);
          return;
        }

        // Find any address already marked as selected
        const preSelected = allAddresses.find((addr) => addr.is_selected);
        if (preSelected) {
          setSelectedAddressState(preSelected);
          return;
        }

        // If none has is_selected=true, pick the first and update it
        const first = allAddresses[0];
        const updated = await updateAddress(first.id, { is_selected: true });
        setSelectedAddressState(updated.data);
      } catch (err) {
        console.error('Erro ao inicializar endereço selecionado:', err);
        setSelectedAddressState(null);
      }
    }

    initializeSelection();
  }, []);

  // 2. When the user explicitly changes the selected address, update it on the server.
  const setSelectedAddress = async (addr: AddressRead | null) => {
    if (!addr) {
      // Unselecting all (if your API supports it, otherwise simply clear local state)
      setSelectedAddressState(null);
      return;
    }

    try {
      // Mark the new address as selected
      const updated = await updateAddress(addr.id, { is_selected: true });
      setSelectedAddressState(updated.data);
    } catch (err) {
      console.error('Erro ao selecionar novo endereço:', err);
    }
  };

  // 3. Filter field logic remains in-memory (no localStorage)
  const setFilterField = (field: FilterField) => {
    setFilterFieldState(field);
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

// src/context/AddressContext.tsx
'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { listAddresses, updateAddress } from '@/services/addressService';
import type { AddressRead } from '@/types/address';

interface AddressContextValue {
  addresses: AddressRead[];
  selectedAddress: AddressRead | null;
  loading: boolean;               // ← novo
  refreshAddresses: () => Promise<void>;
  selectAddress: (addr: AddressRead) => Promise<void>;
}

const AddressContext = createContext<AddressContextValue | undefined>(undefined);

export function AddressProvider({ children }: { children: ReactNode }) {
  const [addresses, setAddresses] = useState<AddressRead[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<AddressRead | null>(null);
  const [loading, setLoading] = useState(true); // ← controla quando terminou de init

  // 1) busca e inicializa seleção
  const refreshAddresses = async () => {
    setLoading(true);
    try {
      const res = await listAddresses();
      const all = res.data;
      setAddresses(all);

      // se já tiver is_selected
      const pre = all.find(a => a.is_selected);
      if (pre) {
        setSelectedAddress(pre);
      } else if (all.length) {
        // senão marca o primeiro
        const { data: upd } = await updateAddress(all[0].id, { is_selected: true });
        setAddresses(prev =>
          prev.map(a => (a.id === upd.id ? upd : { ...a, is_selected: false }))
        );
        setSelectedAddress(upd);
      } else {
        setSelectedAddress(null);
      }
    } catch (err) {
      console.error('Erro ao inicializar endereços:', err);
      setAddresses([]);
      setSelectedAddress(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAddresses();
  }, []);

  // 2) trocar seleção
  const selectAddress = async (addr: AddressRead) => {
    if (selectedAddress?.id === addr.id) return;
    setLoading(true);
    try {
      if (selectedAddress) {
        await updateAddress(selectedAddress.id, { is_selected: false });
      }
      const { data: upd } = await updateAddress(addr.id, { is_selected: true });
      setAddresses(prev =>
        prev.map(a =>
          a.id === upd.id
            ? upd
            : a.id === selectedAddress?.id
            ? { ...a, is_selected: false }
            : a
        )
      );
      setSelectedAddress(upd);
    } catch (err) {
      console.error('Erro ao selecionar endereço:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AddressContext.Provider
      value={{
        addresses,
        selectedAddress,
        loading,            // ← exposto
        refreshAddresses,
        selectAddress,
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

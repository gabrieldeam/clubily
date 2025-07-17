// src/context/AddressContext.tsx
'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useAuth } from '@/context/AuthContext';
import { listAddresses, updateAddress } from '@/services/addressService';
import type { AddressRead } from '@/types/address';

interface AddressContextValue {
  addresses: AddressRead[];
  selectedAddress: AddressRead | null;
  radiusKm: number;
  setRadiusKm: (km: number) => void;
  loading: boolean;
  refreshAddresses: () => Promise<void>;
  selectAddress: (addr: AddressRead) => Promise<void>;
}

const AddressContext = createContext<AddressContextValue | undefined>(undefined);

export function AddressProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [addresses, setAddresses] = useState<AddressRead[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<AddressRead | null>(null);

  // 1) inicializa lendo do localStorage (ou usa 10)
  const [radiusKm, _setRadiusKm] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('radiusKm');
      return stored ? parseFloat(stored) : 10;
    }
    return 10;
  });

  const [loading, setLoading] = useState(false);

  // 2) sempre que radiusKm mudar, salva no localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('radiusKm', radiusKm.toString());
    }
  }, [radiusKm]);

  // wrapper para expor no contexto
  const setRadiusKm = (km: number) => {
    _setRadiusKm(km);
  };

  const refreshAddresses = async () => {
    setLoading(true);
    try {
      const res = await listAddresses();
      const all = res.data;
      setAddresses(all);

      const pre = all.find(a => a.is_selected);
      if (pre) {
        setSelectedAddress(pre);
      } else if (all.length) {
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
    if (!authLoading && user) {
      refreshAddresses();
    }
  }, [authLoading, user]);

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
        radiusKm,
        setRadiusKm,
        loading,
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

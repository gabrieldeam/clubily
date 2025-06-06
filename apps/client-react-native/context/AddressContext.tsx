// src/context/AddressContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { listAddresses, updateAddress } from '../services/addressService';
import type { AddressRead, AddressUpdate } from '../types/address';
import { useAuth } from './AuthContext';

interface AddressContextValue {
  selectedAddress: AddressRead | null;
  setSelectedAddress: (addr: AddressRead | null) => Promise<void>;
}

const AddressContext = createContext<AddressContextValue | undefined>(undefined);

export function AddressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [selectedAddress, setSelectedAddressState] = useState<AddressRead | null>(null);

  // Ao autenticar (user muda de null → UserRead), carrega endereços e define “is_selected”
  useEffect(() => {
    if (!user) {
      // Usuário deslogado: zera seleção
      setSelectedAddressState(null);
      return;
    }

    (async () => {
      try {
        // 1) busca todos os endereços do usuário
        const res = await listAddresses();
        const all: AddressRead[] = res.data;

        if (all.length === 0) {
          setSelectedAddressState(null);
          return;
        }

        // 2) verifica se há algum marcado como is_selected
        const already = all.find(addr => addr.is_selected);
        if (already) {
          setSelectedAddressState(already);
          return;
        }

        // 3) se não houver nenhum com is_selected=true, pega o primeiro e faz PATCH
        const first = all[0];
        const patchPayload: AddressUpdate = { is_selected: true };
        const updated = await updateAddress(first.id, patchPayload);
        setSelectedAddressState(updated.data);
      } catch (err) {
        console.error('Erro ao inicializar selectedAddress:', err);
        setSelectedAddressState(null);
      }
    })();
  }, [user]);

  // Função para trocar manualmente o endereço selecionado:
  // 1) PATCH no antigo para is_selected=false
  // 2) PATCH no novo para is_selected=true
  const setSelectedAddress = async (addr: AddressRead | null) => {
    try {
      // 1) desmarca o anterior
      if (selectedAddress) {
        await updateAddress(selectedAddress.id, { is_selected: false });
      }
      // 2) marca o novo (se for não-nulo)
      if (addr) {
        const updated = await updateAddress(addr.id, { is_selected: true });
        setSelectedAddressState(updated.data);
      } else {
        setSelectedAddressState(null);
      }
    } catch (err) {
      console.error('Erro ao alterar selectedAddress:', err);
    }
  };

  return (
    <AddressContext.Provider value={{ selectedAddress, setSelectedAddress }}>
      {children}
    </AddressContext.Provider>
  );
}

export function useAddress() {
  const ctx = useContext(AddressContext);
  if (!ctx) throw new Error('useAddress must be used dentro de AddressProvider');
  return ctx;
}

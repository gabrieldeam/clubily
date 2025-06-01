import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { listAddresses } from '../services/addressService';
import type { AddressRead } from '../types/address';

export type FilterField = 'city' | 'street' | 'postal_code' | 'country';

interface AddressContextValue {
  selectedAddress: AddressRead | null;
  setSelectedAddress: (addr: AddressRead | null) => Promise<void>;
  filterField: FilterField;
  setFilterField: (field: FilterField) => Promise<void>;
}

const AddressContext = createContext<AddressContextValue | undefined>(undefined);

export function AddressProvider({ children }: { children: ReactNode }) {
  const [selectedAddress, setSelectedAddressState] = useState<AddressRead | null>(null);
  const [filterField, setFilterFieldState] = useState<FilterField>('city');

  // Carregar filterField salvo
  useEffect(() => {
    (async () => {
      const storedField = await AsyncStorage.getItem('addressFilterField');
      if (storedField) {
        setFilterFieldState(storedField as FilterField);
      }
    })();
  }, []);

  // Ao iniciar o app, busca todos os endereços e.define selectedAddress:
  // se existir selectedAddressId salvo, usa esse; senão pega o primeiro da lista
  useEffect(() => {
    (async () => {
      try {
        // 1) busca lista completa de endereços
        const res = await listAddresses();
        const allAddresses: AddressRead[] = res.data;

        // 2) tenta recuperar o ID salvo
        const storedId = await AsyncStorage.getItem('selectedAddressId');

        if (storedId) {
          // 3) procura esse ID na lista obtida
          const found = allAddresses.find((addr) => addr.id === storedId);
          if (found) {
            // 4a) se encontrar, define como selecionado e persiste (setSelectedAddress já grava em AsyncStorage)
            await setSelectedAddress(found);
            return;
          }
          // se não achar, cai para pegar o primeiro abaixo
        }

        // 4b) se não havia ID salvo ou não foi encontrado, e se houver ao menos um endereço, seleciona o primeiro
        if (allAddresses.length > 0) {
          await setSelectedAddress(allAddresses[0]);
        } else {
          // se não há nenhum endereço salvo, mantém null
          await setSelectedAddress(null);
        }
      } catch (err) {
        console.error('Erro ao inicializar selectedAddress:', err);
        // em caso de falha na requisição, garantimos que não fique nada armazenado indevidamente
        await AsyncStorage.removeItem('selectedAddressId');
        setSelectedAddressState(null);
      }
    })();
  }, []);

  // Persistir seleção de endereço
  const setSelectedAddress = async (addr: AddressRead | null) => {
    setSelectedAddressState(addr);
    if (addr) {
      await AsyncStorage.setItem('selectedAddressId', addr.id);
    } else {
      await AsyncStorage.removeItem('selectedAddressId');
    }
  };

  // Persistir filtro
  const setFilterField = async (field: FilterField) => {
    setFilterFieldState(field);
    await AsyncStorage.setItem('addressFilterField', field);
  };

  return (
    <AddressContext.Provider
      value={{ selectedAddress, setSelectedAddress, filterField, setFilterField }}
    >
      {children}
    </AddressContext.Provider>
  );
}

export function useAddress() {
  const ctx = useContext(AddressContext);
  if (!ctx) throw new Error('useAddress must be used within an AddressProvider');
  return ctx;
}

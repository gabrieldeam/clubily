import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AddressRead } from '../types/address';
import { getAddressById } from '../services/addressService';

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

  // carregar filterField salvo
  useEffect(() => {
    (async () => {
      const storedField = await AsyncStorage.getItem('addressFilterField');
      if (storedField) setFilterFieldState(storedField as FilterField);
    })();
  }, []);

  // carregar selectedAddress salvo
  useEffect(() => {
    (async () => {
      const storedId = await AsyncStorage.getItem('selectedAddressId');
      if (storedId) {
        try {
          const res = await getAddressById(storedId);
          setSelectedAddressState(res.data);
        } catch {
          await AsyncStorage.removeItem('selectedAddressId');
          setSelectedAddressState(null);
        }
      }
    })();
  }, []);

  // persistir seleção de endereço
  const setSelectedAddress = async (addr: AddressRead | null) => {
    setSelectedAddressState(addr);
    if (addr) {
      await AsyncStorage.setItem('selectedAddressId', addr.id);
    } else {
      await AsyncStorage.removeItem('selectedAddressId');
    }
  };

  // persistir filtro
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

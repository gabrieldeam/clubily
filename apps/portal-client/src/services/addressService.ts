// src/services/addressService.ts

import api from './api';
import type { AddressCreate, AddressRead } from '@/types/address';

/**
 * Cria um novo endereço para o usuário logado.
 */
export const createAddress = (payload: AddressCreate) =>
  api.post<AddressRead>('/addresses', payload);

/**
 * Lista todos os endereços do usuário logado.
 */
export const listAddresses = () =>
  api.get<AddressRead[]>('/addresses');

/**
 * Remove um endereço do usuário logado pelo ID.
 */
export const deleteAddress = (addressId: string) =>
  api.delete<void>(`/addresses/${addressId}`);

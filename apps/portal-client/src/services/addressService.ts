// src/services/addressService.ts

import api from './api';
import type { AddressCreate, AddressRead, AddressUpdate } from '@/types/address';

/**
 * Cria um novo endereço para o usuário logado.
 */
export const createAddress = (payload: AddressCreate) =>
  api.post<AddressRead>('/addresses/', payload);

/**
 * Lista todos os endereços do usuário logado.
 */
export const listAddresses = () =>
  api.get<AddressRead[]>('/addresses/');

/**
 * Remove um endereço do usuário logado pelo ID.
 */
export const deleteAddress = (addressId: string) =>
  api.delete<void>(`/addresses/${addressId}`);


/** Busca um endereço pelo ID */
export const getAddressById = (id: string) =>
  api.get<AddressRead>(`/addresses/${id}`);

/**
 * Atualiza parcialmente um endereço existente (PATCH /addresses/{address_id}).
 */
export const updateAddress = (addressId: string, payload: AddressUpdate) =>
  api.patch<AddressRead>(`/addresses/${addressId}`, payload);
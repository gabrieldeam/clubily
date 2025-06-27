import api from './api';
import type {
  TransferMethodCreate,
  TransferMethodRead,
} from '@/types/transferMethod';

/**
 * Cadastra nova chave PIX
 * POST /transfer_methods
 */
export const createTransferMethod = (payload: TransferMethodCreate) =>
  api.post<TransferMethodRead>('/transfer_methods', payload);

/**
 * Lista chaves PIX do usuário
 * GET /transfer_methods
 */
export const listTransferMethods = () =>
  api.get<TransferMethodRead[]>('/transfer_methods');

/**
 * Remove uma chave PIX
 * DELETE /transfer_methods/{method_id}
 */
export const deleteTransferMethod = (methodId: string) =>
  api.delete<void>(`/transfer_methods/${methodId}`);

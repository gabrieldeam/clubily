// src/services/walletService.ts
import api from './api';
import type { WalletRead, 
  UserWalletRead, 
  WalletWithdraw,
  PaginatedWalletTransactions,
} from '@/types/wallet';

/**
 * Recupera (ou cria) a carteira da empresa logada.
 * GET /wallet
 */
export const getWallet = () =>
  api.get<WalletRead>('/wallet');

/**
 * Recupera (ou cria) a carteira de um usuário para a empresa logada.
 * GET /wallet/{user_id}/wallet
 */
export const getUserWallet = (userId: string) =>
  api.get<UserWalletRead>(`/wallet/${userId}/wallet`);

/**
 * Debita um valor da carteira do usuário (empresa autenticada).
 * POST /wallet/{user_id}/wallet/withdraw
 */
export const withdrawUserWallet = (userId: string, payload: WalletWithdraw) =>
  api.post<UserWalletRead>(
    `/wallet/${userId}/wallet/withdraw`,
    payload
  );

/**
 * Lista o extrato (crédito/débito) paginado da carteira da empresa logada.
 * GET /wallet/transactions?skip=0&limit=10
 */
export const listWalletTransactions = (
  skip = 0,
  limit = 10
) =>
  api.get<PaginatedWalletTransactions>('/wallet/transactions', {
    params: { skip, limit },
  });
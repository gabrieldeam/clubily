// src/services/pointsService.ts
import api from './api';
import type {
  UserPointsWalletRead,
  PaginatedUserPointsTransactions,
} from '@/types/pointsUserWallet';

/**
 * Busca o saldo de pontos do usuário autenticado.
 * GET /points/balance
 */
export const getUserPointsBalance = () =>
  api.get<UserPointsWalletRead>('/points/balanceUser');

/**
 * Lista transações de pontos do usuário autenticado, paginadas.
 * GET /points/transactions?skip=0&limit=10
 */
export const getUserPointsTransactions = (skip = 0, limit = 10) =>
  api.get<PaginatedUserPointsTransactions>('/points/transactionsUser', {
    params: { skip, limit },
  });

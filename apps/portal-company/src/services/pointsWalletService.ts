// src/services/pointsWalletService.ts
import api from './api'
import type { PointsBalance, PaginatedPointsTransactions } from '@/types/pointsWallet'

/**
 * Recupera o saldo de pontos da empresa logada.
 * GET /points/balance
 */
export const getPointsBalance = () =>
  api.get<PointsBalance>('/points/balance')

/**
 * Lista o extrato (crédito/débito) paginado da carteira de pontos da empresa logada.
 * GET /points/transactions?skip=0&limit=10
 */
export const listPointsTransactions = (
  skip = 0,
  limit = 10
) =>
  api.get<PaginatedPointsTransactions>('/points/transactions', {
    params: { skip, limit },
  });
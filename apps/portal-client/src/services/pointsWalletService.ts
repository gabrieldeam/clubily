import api from './api';
import type {
  PointsBalance,
  PointsOperation,
  PaginatedPointsTransactions,
} from '@/types/pointsWallet';

const BASE_URL = '/points/admin';

/**
 * Busca o saldo de pontos de uma empresa (admin).
 * GET /points/admin/{companyId}/balance
 */
export const getPointsBalance = (companyId: string) =>
  api.get<PointsBalance>(`${BASE_URL}/${companyId}/balance`);

/**
 * Debita pontos da empresa (admin).
 * POST /points/admin/{companyId}/debit
 */
export const debitPoints = (companyId: string, op: PointsOperation) =>
  api.post<PointsBalance>(`${BASE_URL}/${companyId}/debit`, op);

/**
 * Credita pontos na empresa (admin).
 * POST /points/admin/{companyId}/credit
 */
export const creditPoints = (companyId: string, op: PointsOperation) =>
  api.post<PointsBalance>(`${BASE_URL}/${companyId}/credit`, op);

/**
 * Lista transações de pontos paginadas (admin).
 * GET /points/admin/{companyId}/transactions?skip=&limit=
 */
export const listPointsTransactions = (
  companyId: string,
  skip = 0,
  limit = 10
) =>
  api.get<PaginatedPointsTransactions>(
    `${BASE_URL}/${companyId}/transactions`,
    { params: { skip, limit } }
  );

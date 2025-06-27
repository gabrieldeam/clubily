// src/services/commissionAdminService.ts
import api from './api';
import type { CommissionWithdrawalRead } from '@/types/commissionAdmin';

const BASE_URL = '/admin/commissions';

/**
 * Lista saques de comissão paginados
 * @param skip quantos itens pular (default: 0)
 * @param limit quantos itens retornar (default: 10)
 */
export const listWithdrawals = (
  skip = 0,
  limit = 10
) => api.get<CommissionWithdrawalRead[]>(BASE_URL, {
  params: { skip, limit }
});

/**
 * Aprova um saque de comissão
 * @param withdrawalId ID do saque
 */
export const approveWithdrawal = (
  withdrawalId: string
) => api.patch<CommissionWithdrawalRead>(
  `${BASE_URL}/${withdrawalId}/approve`
);

/**
 * Rejeita um saque de comissão
 * @param withdrawalId ID do saque
 */
export const rejectWithdrawal = (
  withdrawalId: string
) => api.patch<CommissionWithdrawalRead>(
  `${BASE_URL}/${withdrawalId}/reject`
);

import api from './api';
import type {
  CommissionBalance,
  PaginatedCommissionTx,
  CommissionWithdrawalCreate,
  CommissionWithdrawalRead,
} from '@/types/commission';

/**
 * Lê o saldo de comissão do usuário logado
 * GET /commissions/balance
 */
export const getCommissionBalance = () =>
  api.get<CommissionBalance>('/commissions/balance');

/**
 * Lista o histórico de transações de comissão (paginado)
 * GET /commissions/history?skip=&limit=
 */
export const listCommissionHistory = (skip = 0, limit = 10) =>
  api.get<PaginatedCommissionTx>('/commissions/history', {
    params: { skip, limit },
  });

/**
 * Solicita um saque de comissão
 * POST /commissions/withdrawals
 */
export const requestCommissionWithdrawal = (payload: CommissionWithdrawalCreate) =>
  api.post<CommissionWithdrawalRead>('/commissions/withdrawals', payload);


/**
 * Lista as suas solicitações de saque
 * GET /commissions/withdrawals
 */
export const listCommissionWithdrawals = () =>
  api.get<CommissionWithdrawalRead[]>('/commissions/withdrawals');
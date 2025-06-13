// src/services/cashbackService.ts
import api from './api';
import type { CashbackCreate, CashbackRead } from '@/types/cashback';

/**
 * Associa cashback a um usuário.
 * POST /users/{user_id}/cashbacks
 */
export const assignCashback = (
  userId: string,
  payload: CashbackCreate
) => api.post<CashbackRead>(`/cashbacks/${userId}`, payload);

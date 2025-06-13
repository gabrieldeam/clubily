// src/services/cashbackService.ts

import api from './api';
import type {
  CashbackRead,
  CashbackSummary,
  UserCashbackCompany,
  PaginatedCashbacks,
} from '@/types/cashback';


/**
 * Lista todos os cashbacks do usuário (paginado).
 * GET /users/{user_id}/cashbacks?skip=&limit=
 */
export const listCashbacks = (
  skip = 0,
  limit = 10
) =>
  api.get<PaginatedCashbacks>(`/cashbacks/cashbacks`, {
    params: { skip, limit },
  });

/**
 * Resumo de saldo de cashback do usuário.
 * GET /users/{user_id}/cashbacks/summary
 */
export const getCashbackSummary = () =>
  api.get<CashbackSummary>(`/cashbacks/summary`);

/**
 * Lista as empresas para as quais o usuário tem cashback (paginado).
 * GET /users/{user_id}/cashbacks/companies?skip=&limit=
 */
export const listCashbackCompanies = (
  skip = 0,
  limit = 10
) =>
  api.get<UserCashbackCompany[]>(`/cashbacks/companies`, {
    params: { skip, limit },
  });

/**
 * Lista cashbacks do usuário em uma empresa específica (paginado).
 * GET /users/{user_id}/cashbacks/company/{company_id}?skip=&limit=
 */
export const listCashbacksByCompany = (
  companyId: string,
  skip = 0,
  limit = 10
) =>
  api.get<CashbackRead[]>(`/cashbacks/company/${companyId}`, {
    params: { skip, limit },
  });

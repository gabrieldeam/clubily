// src/services/cashbackService.ts

import api from './api';
import type {
  CashbackRead,
  UserCashbackCompany,
  PaginatedCashbacks,
  PaginatedCashbackCompanies
} from '@/types/cashback';


/**
 * Lista todos os cashbacks do usuário (paginado).
 * GET /users/{user_id}/cashbacks?skip=&limit=
 */
export const listCashbacks = (
  skip = 0,
  limit = 10
) =>
  api.get<PaginatedCashbacks>(`/cashbacks`, {
    params: { skip, limit },
  });

/**
 * Lista as empresas para as quais o usuário tem cashback (paginado).
 * GET /users/{user_id}/cashbacks/companies?skip=&limit=
 */
export const listCashbackCompanies = async (
  skip = 0,
  limit = 10
): Promise<{ data: PaginatedCashbackCompanies }> => {
  // o backend está retornando UserCashbackCompany[]
  const res = await api.get<UserCashbackCompany[]>(
    `/cashbacks/companies`,
    { params: { skip, limit } }
  );
  return {
    data: {
      items: res.data,
      total: res.data.length,
      skip,
      limit,
    }
  };
};

// — cashbacks filtrado por empresa —
export const listCashbacksByCompany = async (
  companyId: string,
  skip = 0,
  limit = 10
): Promise<{ data: PaginatedCashbacks }> => {
  const res = await api.get<CashbackRead[]>(
    `/cashbacks/company/${companyId}`,
    { params: { skip, limit } }
  );
  return {
    data: {
      items: res.data,
      total: res.data.length,
      skip,
      limit,
    },
  };
};
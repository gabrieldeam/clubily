// services/cashbackService.ts
import api from './api';
import type {
  PaginatedCashbacks,
  CashbackSummary,
  UserCashbackCompany,
  CashbackRead,
} from '../types/cashback';

export const getCashbacks = (
  skip = 0,
  limit = 10
): Promise<PaginatedCashbacks> =>
  api
    .get<PaginatedCashbacks>('/cashbacks', {
      params: { skip, limit },
    })
    .then(res => res.data);

export const getCashbackSummary = (): Promise<CashbackSummary> =>
  api
    .get<CashbackSummary>('/cashbacks/summary')
    .then(res => res.data);

export const getCompaniesWithCashback = (
  skip = 0,
  limit = 10
): Promise<UserCashbackCompany[]> =>
  api
    .get<UserCashbackCompany[]>('/cashbacks/companies', {
      params: { skip, limit },
    })
    .then(res => res.data);

export const getCashbacksByCompany = (
  companyId: string,
  skip = 0,
  limit = 10
): Promise<CashbackRead[]> =>
  api
    .get<CashbackRead[]>(
      `/cashbacks/company/${companyId}`,
      {
        params: { skip, limit },
      }
    )
    .then(res => res.data);

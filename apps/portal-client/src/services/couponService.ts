// src/services/couponService.ts
import api from './api';
import type {
  PaginatedCoupons,
  PublicVisibleCouponsQuery,
} from '@/types/coupon';

/**
 * Lista cupons públicos (ativos + visíveis).
 * Requer usuário autenticado (cookie ou Authorization já tratados no api.ts).
 */
export async function listPublicVisibleCoupons(
  params: PublicVisibleCouponsQuery = {},
  signal?: AbortSignal
): Promise<PaginatedCoupons> {
  const { skip = 0, limit = 10, company_id } = params;

  const { data } = await api.get<PaginatedCoupons>(
    '/coupons/public/visible',
    {
      params: { skip, limit, company_id },
      signal,
    }
  );

  return data;
}

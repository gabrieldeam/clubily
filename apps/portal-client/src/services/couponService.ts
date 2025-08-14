// src/services/couponService.ts
import api from './api';
import type {
  PaginatedCoupons,
  PublicVisibleCouponsQuery,
  // ⬇️ novos types admin:
  CouponStatsAdmin,
  CouponUserAggregateAdmin,
  CouponRedemptionUserAdmin,
  AdminCouponStatsParams,
  AdminCouponUsersParams,
  AdminCouponRedemptionsParams,
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


/* ======================================================================= */
/*  PLATFORM ADMIN (Coupons)                                               */
/* ======================================================================= */

/** GET /coupons/platform/admin/coupons/stats
 *  Retorna array de stats por cupom; paginação nos headers.
 */
export const listPlatformCouponStats = (
  params: AdminCouponStatsParams = {},
  signal?: AbortSignal
) =>
  api.get<CouponStatsAdmin[]>(
    '/coupons/platform/admin/coupons/stats',
    { params, signal }
  );

/** GET /coupons/platform/admin/coupons/{coupon_id}/users
 *  Retorna agregado por usuário para um cupom; paginação nos headers.
 */
export const listPlatformCouponUsersAggregate = (
  couponId: string,
  params: AdminCouponUsersParams = {},
  signal?: AbortSignal
) =>
  api.get<CouponUserAggregateAdmin[]>(
    `/coupons/platform/admin/coupons/${couponId}/users`,
    { params, signal }
  );

/** GET /coupons/platform/admin/coupons/{coupon_id}/redemptions
 *  Retorna lista detalhada de resgates; paginação nos headers.
 */
export const listPlatformCouponRedemptions = (
  couponId: string,
  params: AdminCouponRedemptionsParams = {},
  signal?: AbortSignal
) =>
  api.get<CouponRedemptionUserAdmin[]>(
    `/coupons/platform/admin/coupons/${couponId}/redemptions`,
    { params, signal }
  );
// src/services/couponService.ts
import api from "./api";
import type {
  CouponCreate,
  CouponUpdate,
  CouponRead,
  PaginatedCoupons,
  CouponValidateRequest,
  CouponValidateResponse,
} from "@/types/coupon";


const BASE_PATH = "/coupons";

/**
 * Lista cupons da empresa logada (paginado).
 * GET /coupons?skip=&limit=
 *
 * Dica: o backend limita limit <= 100; aqui mantemos params livres e deixamos o backend validar.
 */
export const listCoupons = (params?: { skip?: number; limit?: number }) =>
  api.get<PaginatedCoupons>(BASE_PATH, { params });

/**
 * Cria um cupom.
 * POST /coupons
 */
export const createCoupon = (payload: CouponCreate) =>
  api.post<CouponRead>(BASE_PATH, payload);

/**
 * Detalha um cupom pelo ID (UUID).
 * GET /coupons/{coupon_id}
 */
export const getCoupon = (couponId: string) =>
  api.get<CouponRead>(`${BASE_PATH}/${couponId}`);

/**
 * Atualiza (parcial) um cupom.
 * PUT /coupons/{coupon_id}
 */
export const updateCoupon = (couponId: string, payload: CouponUpdate) =>
  api.put<CouponRead>(`${BASE_PATH}/${couponId}`, payload);

/**
 * Exclui um cupom.
 * DELETE /coupons/{coupon_id}
 */
export const deleteCoupon = (couponId: string) =>
  api.delete<void>(`${BASE_PATH}/${couponId}`);


/**
 * Buscar cupom pelo código (case-insensitive)
 * GET /coupons/by-code/{code}
 */
export const getCouponByCode = (code: string) =>
  api.get<CouponRead>(`${BASE_PATH}/by-code/${encodeURIComponent(code)}`);

/**
 * Validar cupom (preview, não grava uso) — chama /redeem com dry_run=true
 */
export const previewCoupon = (payload: Omit<CouponValidateRequest, "dry_run">) =>
  api.post<CouponValidateResponse>(`${BASE_PATH}/redeem`, {
    ...payload,
    dry_run: true,
  });

/**
 * Resgatar cupom (grava uso) — chama /redeem com dry_run=false
 */
export const redeemCoupon = (payload: Omit<CouponValidateRequest, "dry_run">) =>
  api.post<CouponValidateResponse>(`${BASE_PATH}/redeem`, {
    ...payload,
    dry_run: false,
  });
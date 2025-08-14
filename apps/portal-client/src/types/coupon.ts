// src/types/coupon.ts

export type DiscountType = 'percent' | 'fixed';

export interface CouponRead {
  id: string;
  company_id: string;

  name: string;
  code: string;
  description?: string | null;

  is_active: boolean;
  is_visible: boolean;

  usage_limit_total?: number | null;
  usage_limit_per_user?: number | null;

  min_order_amount?: number | null;

  discount_type?: DiscountType | null;
  discount_value?: number | null;

  category_ids: string[];
  item_ids: string[];

  source_location_name?: string | null;
  source_lat?: number | null;
  source_lng?: number | null;

  created_at?: string | null; // ISO
  updated_at?: string | null; // ISO
}

export interface PaginatedCoupons {
  total: number;
  skip: number;
  limit: number;
  items: CouponRead[];
}

export interface PublicVisibleCouponsQuery {
  skip?: number;        // default sugerido: 0
  limit?: number;       // default sugerido: 10
  company_id?: string;  // opcional: filtrar por empresa
}


/* ========================================================================== */
/*  PLATFORM ADMIN (Coupons)                                                  */
/* ========================================================================== */

export interface CouponStatsAdmin {
  coupon_id: string;
  company_id: string;
  company_name: string;

  name: string;
  code: string;
  is_active: boolean;
  is_visible: boolean;

  usage_limit_total?: number | null;
  usage_limit_per_user?: number | null;
  min_order_amount?: number | null;

  discount_type?: DiscountType | null;  // 'percent' | 'fixed' | null
  discount_value?: number | null;

  created_at?: string | null;           // ISO
  updated_at?: string | null;           // ISO

  used_count: number;                   // total de usos
  unique_users: number;                 // usuários distintos
  total_discount_applied: number;       // soma dos descontos aplicados
  total_amount: number;                 // soma dos amounts (antes do desconto)
  last_redemption_at?: string | null;   // ISO
}

/** Parâmetros de listagem de stats */
export interface AdminCouponStatsParams {
  page?: number;           // default 1
  page_size?: number;      // default 20
  company_id?: string;     // filtrar por empresa
  active?: boolean;        // filtrar por status
  visible?: boolean;       // filtrar por visibilidade
  q?: string;              // busca por nome/código
  created_from?: string;   // ISO
  created_to?: string;     // ISO
}

/** Agregado por usuário (quantas vezes usou, totais, janelas) */
export interface CouponUserAggregateAdmin {
  coupon_id: string;
  user_id: string;
  user_name?: string | null;
  user_email?: string | null;

  uses_count: number;
  total_discount_applied: number;
  total_amount: number;
  first_used_at?: string | null;  // ISO
  last_used_at?: string | null;   // ISO
}

/** Parâmetros para /users (agregado por usuário) */
export interface AdminCouponUsersParams {
  page?: number;         // default 1
  page_size?: number;    // default 20
  date_from?: string;    // ISO
  date_to?: string;      // ISO
}

/** Lista detalhada de resgates (um por linha) */
export interface CouponRedemptionUserAdmin {
  redemption_id: string;
  coupon_id: string;
  user_id: string;
  user_name?: string | null;
  user_email?: string | null;

  amount: number;
  discount_applied: number;

  source_location_name?: string | null;
  redemption_lat?: number | null;
  redemption_lng?: number | null;

  created_at: string;   // ISO
}

/** Parâmetros para /redemptions (linhas detalhadas) */
export interface AdminCouponRedemptionsParams {
  page?: number;         // default 1
  page_size?: number;    // default 20
  date_from?: string;    // ISO
  date_to?: string;      // ISO
}

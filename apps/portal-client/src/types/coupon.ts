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

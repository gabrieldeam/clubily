// src/types/coupon.ts

// enum igual ao backend
export const DiscountType = {
  percent: "percent",
  fixed: "fixed",
} as const;

export type DiscountType = keyof typeof DiscountType; // "percent" | "fixed"

// Create: obrigatórios name e code; demais opcionais
export interface CouponCreate {
  name: string;
  code: string;

  description?: string;

  is_active?: boolean;
  is_visible?: boolean;

  usage_limit_total?: number | null;
  usage_limit_per_user?: number | null;

  min_order_amount?: number | null;

  discount_type?: DiscountType | null;
  discount_value?: number | null;

  category_ids?: string[] | null; // UUID strings
  item_ids?: string[] | null;

  source_location_name?: string | null;
  source_lat?: number | null;
  source_lng?: number | null;
}

// Update parcial (todos opcionais)
export interface CouponUpdate {
  name?: string;
  code?: string;

  description?: string | null;

  is_active?: boolean;
  is_visible?: boolean;

  usage_limit_total?: number | null;
  usage_limit_per_user?: number | null;

  min_order_amount?: number | null;

  discount_type?: DiscountType | null;
  discount_value?: number | null;

  category_ids?: string[] | null;
  item_ids?: string[] | null;

  source_location_name?: string | null;
  source_lat?: number | null;
  source_lng?: number | null;
}

export interface CouponRead {
  id: string;         // UUID
  company_id: string; // UUID

  name: string;
  code: string;
  description: string | null;

  is_active: boolean;
  is_visible: boolean;

  usage_limit_total: number | null;
  usage_limit_per_user: number | null;

  min_order_amount: number | null;

  discount_type: DiscountType | null;
  discount_value: number | null;

  category_ids: string[]; // sempre lista
  item_ids: string[];

  source_location_name: string | null;
  source_lat: number | null;
  source_lng: number | null;

  created_at: string | null; // ISO date
  updated_at: string | null; // ISO date
}

export interface PaginatedCoupons {
  total: number;
  skip: number;
  limit: number;
  items: CouponRead[];
}

// ==== Redeem / Validate ====
export interface CouponValidateRequest {
  code: string;
  user_id: string;
  amount: number;
  item_ids?: string[];              // UUIDs dos itens do carrinho
  source_lat?: number;
  source_lng?: number;
  source_location_name?: string;
  dry_run?: boolean;                // preview=true (default no preview)
}

export interface CouponValidateResponse {
  valid: boolean;
  reason?: string | null;
  coupon_id?: string | null;
  discount: number;                 // valor do desconto calculado
  final_amount?: number | null;     // amount - discount (só vem quando valid=true)
  redemption_id?: string | null;    // só quando efetivamente resgata (dry_run=false)
}


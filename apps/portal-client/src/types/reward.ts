// src/types/reward.ts

/* Tipos de um sistema de recompensas (catálogo, produtos e pedidos) */

/* ─────────── Categorias ─────────── */
export interface RewardCategoryBase {
  name: string;
  slug: string;
}

// antes: `export interface RewardCategoryCreate extends RewardCategoryBase {}`
// agora:
export type RewardCategoryCreate = RewardCategoryBase;
export type RewardCategoryUpdate = RewardCategoryBase;

export interface RewardCategoryRead extends RewardCategoryBase {
  id: string;
  created_at: string; // ISO date-time
}

/* Paginação genérica para categorias */
export interface PaginatedRewardCategory {
  total: number;
  skip: number;
  limit: number;
  items: RewardCategoryRead[];
}

/* ─────────── Produtos ─────────── */
export interface RewardProductBase {
  name: string;
  sku: string;
  short_desc?: string | null;
  long_desc?: string | null;
  points_cost: number;
  category_ids: string[];
  active: boolean;
}

// antes: `export interface RewardProductCreate  extends RewardProductBase {}`
// agora:
export type RewardProductCreate = RewardProductBase;
export type RewardProductUpdate = RewardProductBase;

export interface RewardProductRead extends RewardProductBase {
  id: string;
  image_url?: string | null;
  pdf_url?: string | null;
  created_at: string;
  categories: RewardCategoryRead[];
}

export interface PaginatedRewardProduct {
  total: number;
  skip: number;
  limit: number;
  category?: RewardCategoryRead;
  items: RewardProductRead[];
}

export interface PaginatedRewardProductWithCategory {
  total: number;
  skip: number;
  limit: number;
  category?: RewardCategoryRead;
  items: RewardProductRead[];
}

/* ─────────── Pedidos ─────────── */
export type OrderStatus = 'pending' | 'approved' | 'refused';

export interface Address {
  recipient: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  complement?: string | null;
}

export interface OrderItemPayload {
  product_id: string;
  quantity: number;
}

export interface RewardOrderCreate extends Address {
  items: OrderItemPayload[];
}

export interface RewardOrderItemRead {
  product: RewardProductRead;
  quantity: number;
}

export interface RewardOrderRead extends Address {
  id: string;
  status: OrderStatus;
  refusal_msg?: string | null;
  created_at: string;
  items: RewardOrderItemRead[];
}

export interface PaginatedRewardOrder {
  total: number;
  skip: number;
  limit: number;
  items: RewardOrderRead[];
}

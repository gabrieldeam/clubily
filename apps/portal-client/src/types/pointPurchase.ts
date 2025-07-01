// src/types/pointPurchase.ts
import type { CompanyBasic } from '@/types/company';
/** Status de uma compra de pontos */
export type PurchaseStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';

/** Leitura de uma compra de pontos */
export interface PointPurchaseRead {
  id: string;                  // UUID
  plan?: PointPlanRead;        // pode vir null
  amount: number;
  status: PurchaseStatus;
  asaas_id: string;
  company: CompanyBasic
  pix_qr_code?: string;
  pix_copy_paste_code?: string;
  pix_expires_at?: string;     // ISO datetime
  created_at: string;          // ISO datetime
  updated_at: string;          // ISO datetime
}

/** Páginação de compras de pontos */
export interface PaginatedPointPurchases {
  total: number;
  skip: number;
  limit: number;
  items: PointPurchaseRead[];
}

// note: PointPlanRead é importado do seu types/pointPlan.ts
import type { PointPlanRead } from './pointPlan';

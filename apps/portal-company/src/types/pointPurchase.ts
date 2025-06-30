import type { PointPlanRead } from './pointPlan'

/**
 * Estado de uma compra de pontos
 */
export type PurchaseStatus = 
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED'

/**
 * Payload para criar uma compra de pontos
 */
export interface PointPurchaseCreate {
  plan_id: string
}

/**
 * Dados retornados ao criar / buscar uma compra de pontos
 */
export interface PointPurchaseRead {
  id: string
  plan?: PointPlanRead
  amount: number
  status: PurchaseStatus
  asaas_id: string
  pix_qr_code?: string
  pix_copy_paste_code?: string
  pix_expires_at?: string
  created_at: string
  updated_at: string
}

/**
 * Listagem paginada de compras de pontos
 */
export interface PaginatedPointPurchases {
  total: number
  skip: number
  limit: number
  items: PointPurchaseRead[]
}

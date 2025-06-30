import api from './api'
import type {
  PointPurchaseCreate,
  PointPurchaseRead,
  PaginatedPointPurchases,
} from '@/types/pointPurchase'

/**
 * Inicia a compra de pontos (pix)
 * POST /point-purchases
 */
export const purchasePoints = (payload: PointPurchaseCreate) =>
  api.post<PointPurchaseRead>('/point-purchases', payload)

/**
 * Todas as compras (admin)
 * GET /point-purchases/admin?skip=&limit=
 */
export const listAllPointPurchases = (skip = 0, limit = 10) =>
  api.get<PaginatedPointPurchases>('/point-purchases/admin', {
    params: { skip, limit },
  })

/**
 * Detalha uma compra específica
 * GET /point-purchases/{purchase_id}
 */
export const getPointPurchase = (purchaseId: string) =>
  api.get<PointPurchaseRead>(`/point-purchases/${purchaseId}`)


/**
 * Histórico de compras de pontos da empresa logada
 * GET /point-purchases?skip=&limit=
 */
export const historyPoints = (skip = 0, limit = 10) =>
  api.get<PaginatedPointPurchases>('/point-purchases', {
    params: { skip, limit }
  })
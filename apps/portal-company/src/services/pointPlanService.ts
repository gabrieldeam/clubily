import api from './api'
import type {
  PointPlanRead,
  PaginatedPointPlans,
} from '@/types/pointPlan'

/**
 * Lista planos de pontos públicos, paginados.
 * GET /point-plans?skip=&limit=
 */
export const listPointPlans = (skip = 0, limit = 10) =>
  api.get<PaginatedPointPlans>('/point-plans', {
    params: { skip, limit },
  })

/**
 * (Opcional) Detalha um plano específico
 * GET /point-plans/{plan_id}
 */
export const getPointPlan = (planId: string) =>
  api.get<PointPlanRead>(`/point-plans/${planId}`)

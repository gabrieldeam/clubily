// src/services/pointPlanService.ts

import api from './api';
import type {
  PointPlanCreate,
  PointPlanUpdate,
  PointPlanRead,
  PaginatedPointPlans
} from '@/types/pointPlan';

const BASE_URL = '/point-plans/admin';

/**
 * Cria um novo plano de pontos (admin)
 * POST /point-plans/admin
 */
export const createPointPlan = (payload: PointPlanCreate) =>
  api.post<PointPlanRead>(`${BASE_URL}/`, payload);

/**
 * Lista planos de pontos com paginação (admin)
 * GET /point-plans/admin?skip={skip}&limit={limit}
 */
export const listAdminPointPlans = (skip = 0, limit = 10) =>
  api.get<PaginatedPointPlans>(`${BASE_URL}/`, { params: { skip, limit } });

/**
 * Busca um plano de pontos pelo ID (admin)
 * GET /point-plans/admin/{id}
 */
export const getPointPlan = (id: string) =>
  api.get<PointPlanRead>(`${BASE_URL}/${id}`);

/**
 * Atualiza parcialmente um plano de pontos (admin)
 * PATCH /point-plans/admin/{id}
 */
export const patchPointPlan = (id: string, payload: PointPlanUpdate) =>
  api.patch<PointPlanRead>(`${BASE_URL}/${id}`, payload);

/**
 * Remove um plano de pontos (admin)
 * DELETE /point-plans/admin/{id}
 */
export const deletePointPlan = (id: string) =>
  api.delete<void>(`${BASE_URL}/${id}`);

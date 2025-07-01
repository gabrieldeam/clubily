// src/services/pointPurchaseService.ts

import api from './api';
import type { PaginatedPointPurchases } from '@/types/pointPurchase';

const BASE_URL = '/point-purchases/admin';

/**
 * Lista todas as compras de pontos (admin), com paginação.
 * GET /point-purchases/admin?skip={skip}&limit={limit}
 */
export const listPointPurchases = (skip = 0, limit = 10) =>
  api.get<PaginatedPointPurchases>(BASE_URL, { params: { skip, limit } });

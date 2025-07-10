// src/services/purchaseMetricsService.ts

import api from './api';
import type {
  SaleByDay,
  PurchaseMetricRead,
  PurchasesPerUser,
  RevenuePerUser,
} from '@/types/purchaseMetrics';

const BASE = '/purchase_metrics';

/** Admin: Métricas de compras */
export const getPurchaseMetrics = (
  start_date?: string,
  end_date?: string
) =>
  api.get<PurchaseMetricRead>(`${BASE}/purchases`, {
    params: { start_date, end_date },
  });

/** Admin: Série diária de compras (nº e receita) */
export const getPurchaseChart = (
  start_date?: string,
  end_date?: string
) =>
  api.get<SaleByDay[]>(`${BASE}/purchases/chart/daily`, {
    params: { start_date, end_date },
  });

/** Admin: Total de compras por usuário */
export const getPurchasesPerUser = (
  start_date?: string,
  end_date?: string
) =>
  api.get<PurchasesPerUser[]>(`${BASE}/purchases/chart/by-user/count`, {
    params: { start_date, end_date },
  });

/** Admin: Receita por usuário */
export const getRevenuePerUser = (
  start_date?: string,
  end_date?: string
) =>
  api.get<RevenuePerUser[]>(`${BASE}/purchases/chart/by-user/revenue`, {
    params: { start_date, end_date },
  });

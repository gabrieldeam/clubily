// src/services/pointsMetricsService.ts

import api from './api';
import type {
  RuleMetricRead,
  PointsMetricRead,
  PointsByDay,
  PointsRedeemedByDay,
  TxUserStatsByDay,
  AvgPointsPerTxByDay,
} from '@/types/pointsMetrics';

const BASE = '/points_metrics';

/** Admin: Métricas por regra */
export const getRuleMetrics = (
  start_date?: string,
  end_date?: string
) =>
  api.get<RuleMetricRead[]>(`${BASE}/rules`, {
    params: { start_date, end_date },
  });

/** Admin: Métrica única de regra */
export const getSingleRuleMetric = (
  ruleId: string,
  start_date?: string,
  end_date?: string
) =>
  api.get<RuleMetricRead>(`${BASE}/rules/${ruleId}`, {
    params: { start_date, end_date },
  });

/** Admin: Métricas gerais de pontos */
export const getPointsOverview = (
  start_date?: string,
  end_date?: string
) =>
  api.get<PointsMetricRead>(`${BASE}/points`, {
    params: { start_date, end_date },
  });

/** Admin: Pontos concedidos diários */
export const getPointsAwardedChart = (
  start_date?: string,
  end_date?: string
) =>
  api.get<PointsByDay[]>(`${BASE}/points/chart/awarded`, {
    params: { start_date, end_date },
  });

/** Admin: Pontos resgatados diários */
export const getPointsRedeemedChart = (
  start_date?: string,
  end_date?: string
) =>
  api.get<PointsRedeemedByDay[]>(`${BASE}/points/chart/redeemed`, {
    params: { start_date, end_date },
  });

/** Admin: Transações x usuários diários */
export const getTxVsUsersChart = (
  start_date?: string,
  end_date?: string
) =>
  api.get<TxUserStatsByDay[]>(`${BASE}/points/chart/tx-users`, {
    params: { start_date, end_date },
  });

/** Admin: Média de pontos por transação diária */
export const getAvgPointsPerTxChart = (
  start_date?: string,
  end_date?: string
) =>
  api.get<AvgPointsPerTxByDay[]>(`${BASE}/points/chart/avg-per-tx`, {
    params: { start_date, end_date },
  });

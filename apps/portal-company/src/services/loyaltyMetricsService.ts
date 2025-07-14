// src/services/loyaltyMetricsService.ts

import api from './api';
import type {
  MetricSummary,
  MetricsCharts,
} from '@/types/LoyaltyMetrics';

/**
 * Busca o resumo de métricas para a empresa.
 * Se tplId for fornecido, filtra para aquele template.
 * dateFrom e dateTo são opcionais (aaaa-mm-dd).
 */
export function getMetricSummary(
  tplId?: string,
  dateFrom?: string,
  dateTo?: string,
) {
  return api.get<MetricSummary>('/loyalty_metrics/admin/metrics/summary', {
    params: {
      tpl_id:      tplId,
      date_from:   dateFrom,
      date_to:     dateTo,
    },
  });
}

/**
 * Busca as séries diárias para construção de gráficos.
 * tplId é opcional; dateFrom e dateTo são obrigatórios.
 */
export function getMetricsCharts(
  tplId: string | undefined,
  dateFrom: string,
  dateTo: string,
) {
  return api.get<MetricsCharts>('/loyalty_metrics/admin/metrics/charts', {
    params: {
      tpl_id:    tplId,
      date_from: dateFrom,
      date_to:   dateTo,
    },
  });
}

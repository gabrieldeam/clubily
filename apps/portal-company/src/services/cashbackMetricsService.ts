// src/services/cashbackMetricsService.ts
import api from './api';
import type {
  MonthlyCharts,
  ProgramMetrics,
  CompanyMetrics
} from '@/types/cashbackMetrics.ts';


/**
 * Dados para os gráficos diários do mês atual.
 * GET /companies/me/metrics/monthly-charts
 */
export const getMonthlyCharts = () =>
  api.get<MonthlyCharts>('/cashback-metrics/monthly-charts');


/**
 * Métricas de todos os programas de cashback da empresa logada
 * GET /companies/me/cashback-programs/metrics
 */
export const getAllProgramsMetrics = () =>
  api.get<ProgramMetrics[]>('/cashback-metrics')


/**
 * Resumo consolidado de TODOS os cashbacks da empresa logada.
 * GET /companies/me/metrics/summary
 */
export const getCompanyMetrics = () =>
  api.get<CompanyMetrics>('/cashback-metrics/summary')
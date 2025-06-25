// src/services/cashbackMetricsService.ts
import api from './api';
import type {
  MonthlyCharts,
  ProgramMetrics,
  CompanyMetrics
} from '@/types/cashbackMetrics';

/**
 * Dados diários para um intervalo (default: mês atual).
 * GET /companies/me/metrics/charts?start_date=&end_date=
 */
export const getMonthlyCharts = (startDate?: string, endDate?: string) =>
  api.get<MonthlyCharts>('/cashback-metrics/charts', {
    params: { start_date: startDate, end_date: endDate }
  });

/**
 * Métricas de TODOS os programas de cashback da empresa logada.
 * GET /companies/me/metrics/
 */
export const getAllProgramsMetrics = () =>
  api.get<ProgramMetrics[]>('/cashback-metrics');

/**
 * Resumo consolidado de TODOS os cashbacks da empresa (opcionalmente filtrado por intervalo).
 * GET /companies/me/metrics/summary?start_date=&end_date=
 */
export const getCompanyMetrics = (startDate?: string, endDate?: string) =>
  api.get<CompanyMetrics>('/cashback-metrics/summary', {
    params: { start_date: startDate, end_date: endDate }
  });

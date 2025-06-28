// src/services/paymentService.ts
import api from './api';
import type {
  PaginatedAdminPayments,
  PaymentStatus,
} from '@/types/payment';

/**
 * Lista cobranças de todas as empresas (admin)
 * @param skip Quantos registros pular
 * @param limit Quantos registros retornar
 * @param status Filtrar por status
 * @param date_from Data mínima (ISO) inclusive
 * @param date_to Data máxima (ISO) inclusive
 */
export const listAdminPayments = (params: {
  skip?: number;
  limit?: number;
  status?: PaymentStatus;
  date_from?: string;
  date_to?: string;
}) => api.get<PaginatedAdminPayments>('/credits/admin/payments', { params });
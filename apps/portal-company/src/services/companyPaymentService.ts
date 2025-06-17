// src/services/companyPaymentService.ts
import api from './api';
import type {
  CompanyPaymentCreate,
  CompanyPaymentRead,
  PaginatedPayments,
  AsaasCustomerCreate,
  CompanyAsaasCustomerRead,
} from '@/types/companyPayment';

/**
 * Gera cobrança PIX (crédito mínimo R$25)
 * POST /credits
 */
export const buyCredits = (payload: CompanyPaymentCreate) =>
  api.post<CompanyPaymentRead>('/credits', payload);

/**
 * Recupera o status de uma cobrança pelo ID
 * GET /credits/{payment_id}
 */
export const getCharge = (paymentId: string) =>
  api.get<CompanyPaymentRead>(`/credits/${paymentId}`);

/**
 * Lista cobranças paginadas da empresa logada
 * GET /credits?skip=&limit=
 */
export const listPayments = (skip = 0, limit = 10) =>
  api.get<PaginatedPayments>('/credits/history', {
    params: { skip, limit },
  });

/**
 * Consulta saldo disponível (se existir)
 * GET /credits/balance
 */
export const getBalance = () =>
  api.get<number>('/credits/balance');

/**
 * Cria o customer Asaas para a empresa logada
 * POST /companies/me/asaas-customer
 */
export const makeAsaasCustomer = (payload: AsaasCustomerCreate) =>
  api.post<CompanyAsaasCustomerRead>('/companies/me/asaas-customer', payload);
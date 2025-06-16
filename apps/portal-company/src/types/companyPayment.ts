// src/types/companyPayment.ts

/**
 * Parâmetros para criar uma cobrança
 */
export interface CompanyPaymentCreate {
  /** Valor da cobrança (>= 25) */
  amount: number;
}

/**
 * Status possíveis de uma cobrança
 */
export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED';

/**
 * Dados de resposta de uma cobrança PIX
 */
export interface CompanyPaymentRead {
  id: string;
  amount: number;
  asaas_id: string;
  pix_qr_code?: string;
  status: PaymentStatus;
  created_at: string; // ISO date
  updated_at: string; // ISO date
}

/**
 * Listagem paginada de pagamentos
 */
export interface PaginatedPayments {
  items: CompanyPaymentRead[];
  skip: number;
  limit: number;
  total: number;
}

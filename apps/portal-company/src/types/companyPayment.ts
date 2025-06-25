// src/types/companyPayment.ts

/**
 * Parâmetros para criar uma cobrança
 */
export interface CompanyPaymentCreate {
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
  pix_qr_code: string;
  pix_copy_paste_code: string;
  pix_expires_at: string;
  status: PaymentStatus;
  created_at: string;
  updated_at: string;
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


export interface AsaasCustomerCreate {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
}

/**
 * Resposta da criação do customer Asaas
 */
export interface CompanyAsaasCustomerRead {
  customer_id: string;
}

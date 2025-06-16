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


export interface AsaasCustomerCreate {
  /** Nome da empresa */
  name: string;
  /** E-mail para cobrança */
  email: string;
  /** CPF ou CNPJ */
  cpfCnpj: string;
  /** Telefone (opcional) */
  phone?: string;
}

/**
 * Resposta da criação do customer Asaas
 */
export interface CompanyAsaasCustomerRead {
  /** ID do customer criado no Asaas */
  customer_id: string;
}
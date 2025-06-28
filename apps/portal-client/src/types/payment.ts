// src/types/payment.ts

/** Situação do pagamento */
export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED';

/** Dados básicos da empresa para admin */
export interface AdminCompanyInfo {
  id: string;        // UUID
  name: string;
  email: string;
  phone?: string;
  cnpj: string;
}

/** Leitura de um registro de pagamento da empresa (admin) */
export interface AdminCompanyPaymentRead {
  id: string;                      // UUID do pagamento
  amount: number;
  asaas_id: string;
  pix_qr_code?: string;
  pix_copy_paste_code?: string;
  pix_expires_at?: string;         // ISO datetime
  status: PaymentStatus;
  created_at: string;
  updated_at: string;
  company: AdminCompanyInfo;
}

/** Páginação de pagamentos (admin) */
export interface PaginatedAdminPayments {
  total: number;
  skip: number;
  limit: number;
  items: AdminCompanyPaymentRead[];
}
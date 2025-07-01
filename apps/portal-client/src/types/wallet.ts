// src/types/wallet.ts

export interface UserCashbackWalletRead {
  id: string;
  user_id: string;
  company_id: string;
  balance: number;
  created_at: string;    // ISO date string
  updated_at: string;    // ISO date string
  company_name?: string;
  company_logo_url?: string;
}

export interface WalletSummary {
  total_balance: number;
  wallet_count: number;
}

export interface WalletTransactionRead {
  id: string;
  company_id: string;
  user_id: string;
  amount: number;       // ou string, dependendo de como vem do back
  created_at: string;   // ISO date string
}

export interface WalletRead {
  company_id: string;   // UUID
  balance: number;      // Decimal convertido para number
  created_at: string;   // ISO datetime
  updated_at: string;   // ISO datetime
}


export interface WalletOperation {
  amount: number;          // valor em reais
  description?: string;    // texto opcional
}

/**
 * Transação de crédito/débito na carteira (admin)
 */
export interface AdminWalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description?: string;
  created_at: string;      // ISO date string
}

/**
 * Extrato paginado de transações da carteira (admin)
 */
export interface PaginatedWalletTransactions {
  total: number;
  skip: number;
  limit: number;
  items: AdminWalletTransaction[];
}
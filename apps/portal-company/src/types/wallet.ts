// src/types/wallet.ts
export interface WalletRead {
  company_id: string;
  balance: number;
  created_at: string;  // ISO date
  updated_at: string;  // ISO date
}

/**
 * Carteira de cashback de um usuário para a empresa logada
 */
export interface UserWalletRead {
  id: string;
  user_id: string;
  company_id: string;
  balance: number;
}

export interface WalletWithdraw {
  amount: number;
}

/**
 * Item de transação de crédito/débito da carteira
 */
export interface WalletTransactionRead {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description?: string;
  created_at: string; // ISO date
}

/**
 * Resposta paginada do extrato de transações da carteira
 */
export interface PaginatedWalletTransactions {
  total: number;
  skip: number;
  limit: number;
  items: WalletTransactionRead[];
}
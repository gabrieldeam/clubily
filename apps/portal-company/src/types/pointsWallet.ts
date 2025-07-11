// src/types/pointsWallet.ts
export interface PointsBalance {
  balance: number;
}

/**
 * Tipo de operação na carteira de pontos
 */
export type TransactionType = 'credit' | 'debit';

/**
 * Item de transação de crédito/débito da carteira de pontos
 */
export interface PointsTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  description?: string;
  created_at: string; // ISO date
}

/**
 * Resposta paginada do extrato de transações de pontos da empresa logada
 */
export interface PaginatedPointsTransactions {
  total: number;
  skip: number;
  limit: number;
  items: PointsTransaction[];
}

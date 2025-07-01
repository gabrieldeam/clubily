// src/types/pointsWallet.ts

/**
 * Saldo de pontos retornado para a empresa
 */
export interface PointsBalance {
  balance: number;
}


export interface PointsOperation {
  points: number;
}


/**
 * Transação de pontos individual
 */
export interface PointsTransaction {
  id: string;
  type: string;
  amount: number;
  description?: string;
  created_at: string; // ISO date string
}

/**
 * Extrato paginado de transações de pontos
 */
export interface PaginatedPointsTransactions {
  total: number;
  skip: number;
  limit: number;
  items: PointsTransaction[];
}
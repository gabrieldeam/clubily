// src/types/pointsWallet.ts

/**
 * Carteira de pontos do usuário.
 */
export interface UserPointsWalletRead {
  user_id: string;     // UUID do usuário
  balance: number;     // saldo atual de pontos
  created_at: string;  // ISO date
  updated_at: string;  // ISO date
}

/**
 * Tipo de transação de pontos.
 */
export type UserPointsTxType = 'award' | 'adjustment';

/**
 * Transação de pontos.
 */
export interface UserPointsTransactionRead {
  id: string;               // UUID da transação
  type: UserPointsTxType;   // award | adjustment
  amount: number;           // quanto foi creditado/debitado
  description?: string;     // descrição opcional
  rule_id?: string;         // ID da regra (se aplicável)
  created_at: string;       // ISO date
}

/**
 * Retorno paginado de transações.
 */
export interface PaginatedUserPointsTransactions {
  total: number;                              // total de registros
  skip: number;                               // quantos foram pulados
  limit: number;                              // limite por página
  items: UserPointsTransactionRead[];         // lista de transações
}

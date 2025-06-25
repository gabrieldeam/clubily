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
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
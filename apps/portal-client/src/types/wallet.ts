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

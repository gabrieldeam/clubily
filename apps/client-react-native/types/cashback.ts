// types/cashback.ts


export interface CashbackRead {
  id: string;
  user_id: string;
  program_id: string;
  cashback_value: number;
  amount_spent: number;
  assigned_at: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
  company_name: string;
  company_logo_url?: string;
  program: CashbackProgramRead;
}

export interface CashbackSummary {
  total_balance: number;
  next_expiration?: string;
}

export interface UserCashbackCompany {
  company_id: string;
  name: string;
  logo_url?: string;
}

export interface PaginatedCashbacks {
  total: number;
  skip: number;
  limit: number;
  items: CashbackRead[];
}

export interface CashbackProgramRead {
  id: string;
  company_id: string;
  created_at: string;
  updated_at: string;
}
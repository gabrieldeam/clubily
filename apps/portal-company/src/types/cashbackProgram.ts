// src/types/cashbackProgram.ts
export interface CashbackProgramBase {
  name: string;
  description: string;
  percent: number;    
  validity_days: number;
  is_active: boolean;
  is_visible: boolean;
  max_per_user?: number;
  min_cashback_per_user?: number;
}

export interface CashbackProgramCreate extends CashbackProgramBase {}

export interface CashbackProgramRead extends CashbackProgramBase {
  id: string;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProgramUsageAssociation {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  amount_spent: number;
  cashback_value: number;
  assigned_at: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

export interface PaginatedProgramUsage {
  total_cashback_value: number;
  usage_count: number;
  average_amount_spent: number;


  unique_user_count: number;
  average_uses_per_user: number;
  average_interval_days: number;

  total_associations: number;
  skip: number;
  limit: number;

  associations: ProgramUsageAssociation[];
}

export interface UserProgramStats {
  program_id: string;
  user_id: string;

  program_valid_count: number;
  program_total_cashback: number;

  company_valid_count: number;
  company_total_cashback: number;

  generated_at: string;
}

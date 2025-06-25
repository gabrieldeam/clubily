// src/types/cashback.ts

import type { CashbackProgramRead } from '@/types/cashbackProgram';

export interface CashbackBase {
  amount_spent: number;
}

export interface CashbackCreate extends CashbackBase {
  program_id: string; // UUID como string
}

export interface CashbackRead extends CashbackBase {
  id: string;
  user_id: string;
  program_id: string;
  cashback_value: number;
  assigned_at: string;   // ISO date string
  expires_at: string;    // ISO date string
  is_active: boolean;
  created_at: string;    // ISO date string
  program: CashbackProgramRead;
  company_name: string;
  company_logo_url?: string;
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


export interface PaginatedCashbackCompanies {
  total: number;
  skip: number;
  limit: number;
  items: UserCashbackCompany[];
}
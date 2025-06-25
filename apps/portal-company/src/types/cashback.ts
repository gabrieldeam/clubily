// src/types/cashback.ts
import type { CashbackProgramRead } from './cashbackProgram';

export interface CashbackBase {
  amount_spent: number;
}

export interface CashbackCreate extends CashbackBase {
  program_id: string;
}

export interface CashbackRead extends CashbackBase {
  id: string;
  user_id: string;
  program_id: string;
  cashback_value: number;
  assigned_at: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
  program: CashbackProgramRead;
}

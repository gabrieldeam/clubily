// src/types/cashbackProgram.ts
export interface CashbackProgramBase {
  name: string;
  description: string;
  percent: number;    
  validity_days: number;
  is_active: boolean;
  is_visible: boolean;
}

export interface CashbackProgramCreate extends CashbackProgramBase {}

export interface CashbackProgramRead extends CashbackProgramBase {
  id: string;
  company_id: string;
  created_at: string;
  updated_at: string;
}

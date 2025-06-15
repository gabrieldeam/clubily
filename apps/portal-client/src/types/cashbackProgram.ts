// src/types/cashbackProgram.ts
export interface CashbackProgramBase {
  name: string;
  description: string;
  percent: number;             // 0–100
  validity_days: number;       // >=1
  is_active: boolean;
  is_visible: boolean;
  max_per_user?: number;       // opcional
  min_cashback_per_user?: number; // opcional
}

export interface CashbackProgramRead extends CashbackProgramBase {
  id: string;
  company_id: string;
  created_at: string;  // ISO
  updated_at: string;  // ISO
}
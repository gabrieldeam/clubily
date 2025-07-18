// src/types/loyalty.ts
import type { CompanyBasic } from '@/types/company';

export interface LinkRead {
  id: string;
  stamp_no: number;
  reward: RewardRead;
}

export interface RewardRead {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  image_url?: string;
  secret: boolean;
  stock_qty?: number;
  created_at: string;
  updated_at: string;
}
/* ---------- rule --------------------------------------------------------- */
export interface RuleRead {
  id: string;                // UUID
  rule_type: string;         // e.g. "value_spent"
  config: Record<string, unknown>;
  order: number;
  active: boolean;
}

/* ---------- template ----------------------------------------------------- */
export interface TemplateRead {
  id: string;
  company_id: string;
  title: string;
  promo_text?: string | null;
  color_primary?: string | null;
  color_bg?:    string | null;
  stamp_icon_url?: string | null;
  stamp_total: number;
  per_user_limit: number;
  emission_start?: string | null;  // ISO
  emission_end?:   string | null;  // ISO
  emission_limit?: number | null;
  active: boolean;
  created_at: string;              // ISO
  updated_at: string;              // ISO
  rules: RuleRead[];             
  rewards_map: LinkRead[];
  company: CompanyBasic
}

/* ---------- instance ----------------------------------------------------- */
export interface InstanceRead {
  id: string;
  template_id: string;
  user_id: string;
  issued_at: string;          // ISO
  expires_at?: string | null;
  stamps_given: number;
  completed_at?: string | null;
  reward_claimed: boolean;
}

/* ---------- detail (instance + joins) ------------------------------------ */
export interface StampRead {
  stamp_no: number;
  given_at: string;           // ISO
  given_by_id?: string | null;
}

export interface RewardRedemptionRead {
  link_id: string;
  instance_id: string;
  used: boolean;
  code: string;
  expires_at: string; // ISO
}

export interface InstanceDetail extends InstanceRead {
  template: TemplateRead;
  stamps: StampRead[];
  redemptions: RewardRedemptionRead[];
}

/* ---------- misc --------------------------------------------------------- */
export interface CodeResponse {
  code: string;
  expires_at: string;         // ISO
}


export interface RewardCodeResponse {
  /** O código para resgatar a recompensa */
  code: string;
  /** Timestamp ISO de expiração */
  expires_at: string;
  reused: boolean;
}
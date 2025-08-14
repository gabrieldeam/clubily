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


/* ---------- platform admin: completed cards ------------------------------ */
export interface CompletedCardAdmin {
  id: string;
  template_id: string;
  template_title: string;
  stamp_total: number;

  user_id: string;
  user_name?: string | null;
  user_email?: string | null;

  company_id: string;
  company_name: string;

  issued_at: string;                 // ISO
  completed_at: string;              // ISO
  expires_at?: string | null;
  stamps_given: number;

  total_rewards: number;
  redeemed_count: number;
  pending_count: number;

  last_stamp_at?: string | null;     // ISO
  time_to_complete_seconds: number;
}

/** Filtros/params aceitos pelo endpoint */
export interface CompletedCardsParams {
  page?: number;                     // default 1
  page_size?: number;                // default 20 (no backend novo usei page_size)
  company_id?: string;
  template_id?: string;
  user_id?: string;
  completed_from?: string;           // ISO date/time
  completed_to?: string;             // ISO date/time
}


/* ---------- platform admin: templates stats -------------------------------- */
export interface TemplateStatsAdmin {
  template_id: string;
  template_title: string;

  company_id: string;
  company_name: string;

  active: boolean;
  created_at: string;          // ISO
  updated_at: string;          // ISO

  stamp_total: number;
  per_user_limit: number;
  emission_start?: string | null;
  emission_end?: string | null;
  emission_limit?: number | null;

  issued_total: number;        // total de emissões (instances)
  active_instances: number;    // instances não concluídas
  completed_instances: number; // instances concluídas
  unique_users: number;        // usuários únicos com instance
  last_issued_at?: string | null;
}

export interface TemplateStatsParams {
  page?: number;               // default 1
  page_size?: number;          // default 20
  company_id?: string;         // filtrar por empresa
  active?: boolean;            // true/false
  created_from?: string;       // ISO
  created_to?: string;         // ISO
}

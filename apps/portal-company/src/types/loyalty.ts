// src/types/loyalty.ts
export interface RuleBase {
  rule_type: string
  config: Record<string, any>
  order?: number
  active?: boolean
}

export interface RuleCreate extends RuleBase {}

export interface RuleRead extends RuleBase {
  id: string
}


export interface TemplateBase {
  title: string
  promo_text?: string | null
  color_primary?: string | null
  color_bg?: string | null
  // stamp_icon_url será URL retornada pela API, não enviado pelo cliente
  stamp_icon_url?: string | null
  stamp_total: number
  emission_limit?: number | null
  per_user_limit?: number
  emission_start?: string | null
  emission_end?: string | null
  active?: boolean
}

export interface TemplateCreate extends Omit<TemplateBase, 'stamp_icon_url'> {}
export interface TemplateUpdate extends Omit<TemplateBase, 'stamp_icon_url'> {}

export interface TemplateRead extends TemplateBase {
  id: string
  company_id: string
  created_at: string
  updated_at: string
  rules: RuleRead[]
}

// src/types/paginated.ts
export interface Paginated<T> {
  data: T[];
  total: number;     // X-Total-Count
  page: number;      // X-Page
  pageSize: number;  // X-Page-Size
}


export interface InstanceRead {
  id: string
  template_id: string
  user_id: string
  issued_at: string
  expires_at?: string | null
  stamps_given: number
  completed_at?: string | null
  reward_claimed: boolean
}

export interface StampRequest {
  code: string;
  amount?: number;
  purchased_items?: string[];
  service_id?: string;
  event_name?: string;
  visit_count?: number;
}


export interface InstanceAdminDetail extends InstanceRead {
  /** Nome do usuário dono do cartão */
  user_name: string
  /** E‑mail do usuário dono do cartão */
  user_email: string
  /** Total de carimbos que esse template exige */
  stamp_total: number
  /** Quantas recompensas estão associadas a esse template */
  total_rewards: number
  /** Quantas recompensas esse usuário já resgatou */
  redeemed_count: number
  /** Quantas recompensas esse usuário ganhou mas ainda não resgatou */
  pending_count: number
}
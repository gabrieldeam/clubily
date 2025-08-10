// src/types/loyalty.ts
export interface RuleBase {
  rule_type: string
  config: Record<string, unknown>
  order?: number
  active?: boolean
}

export type RuleCreate = RuleBase;

export interface RuleRead extends RuleBase {
  id: string;
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

/** Criação de template (sem stamp_icon_url) */
export type TemplateCreate = Omit<TemplateBase, 'stamp_icon_url'>;
/** Atualização de template (sem stamp_icon_url) */
export type TemplateUpdate = Omit<TemplateBase, 'stamp_icon_url'>;

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


// payload para emitir cartão para um usuário
export interface IssueForUserPayload {
  user_id: string;
}

// payload de carimbo DIRETO (sem código)
export interface StampData {
  amount?: number;
  purchased_items?: string[];
  service_id?: string;
  event_name?: string;
  visit_count?: number;
}

// filtros extras para listar cartões da empresa
export interface AdminCompanyInstanceFilters extends InstanceFilters {
  template_id?: string;
  user_id?: string;
}

// filtros base para listagem de instâncias
export interface InstanceFilters {
  page?: number;
  page_size?: number;
  status?: 'active' | 'completed';
  missing_leq?: number;
  expires_within?: number;
}

// --- Tipos extras para o admin ver cartões detalhados ---
export interface CompanyBasic {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  cnpj?: string | null;
  logo_url?: string | null;
}

export interface RewardRead {
  id: string;
  name: string;
  image_url?: string | null;
}

export interface TemplateRewardLinkRead {
  id: string;
  stamp_no: number;
  reward: RewardRead;
}

export interface StampRead {
  stamp_no: number;
  given_at: string;
  given_by_id?: string | null;
}

export interface RewardRedemptionRead {
  link_id: string;
  instance_id: string;
  used: boolean;
  code?: string;
  expires_at?: string;
}

// Evita quebrar TemplateRead existente
export interface TemplateReadFull extends TemplateRead {
  company: CompanyBasic;
  rewards_map: TemplateRewardLinkRead[];
}

export interface InstanceDetail extends InstanceRead {
  template: TemplateReadFull;
  stamps: StampRead[];
  redemptions: RewardRedemptionRead[];
}

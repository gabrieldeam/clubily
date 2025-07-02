// src/types/points.ts
export enum RuleType {
  value_spent      = "value_spent",
  event            = "event",
  frequency        = "frequency",
  category         = "category",
  first_purchase   = "first_purchase",
  recurrence       = "recurrence",
  digital_behavior = "digital_behavior",
  special_date     = "special_date",
  geolocation      = "geolocation",
  inventory        = "inventory",
}

export interface PointsRuleBase {
  name: string;
  description?: string;
  rule_type: RuleType;
  config: Record<string, any>;
  active: boolean;
  visible: boolean;
}

// usado ao criar ou atualizar
export interface PointsRuleCreate extends PointsRuleBase {}
export interface PointsRuleUpdate extends PointsRuleBase {}

// retorno dos endpoints
export interface PointsRuleRead extends PointsRuleBase {
  id: string;
  company_id: string;
  created_at: string; // ISO
  updated_at: string; // ISO
}

// payload / resposta da avaliação manual
export interface EvaluateRulePayload {
  user_id: string;
  data: Record<string, any>;
}
export interface EvaluateRuleResponse {
  awarded: number;
}

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

// ⚠️ Troca `any` por `unknown`
export interface PointsRuleBase {
  name: string;
  description?: string;
  rule_type: RuleType;
  config: Record<string, unknown>;
  active: boolean;
  visible: boolean;
}

// Interfaces redundantes → transforme em alias
export type PointsRuleCreate = PointsRuleBase;
export type PointsRuleUpdate = PointsRuleBase;

// Leitura continua igual
export interface PointsRuleRead extends PointsRuleBase {
  id: string;
  company_id: string;
  created_at: string; // ISO
  updated_at: string; // ISO
}

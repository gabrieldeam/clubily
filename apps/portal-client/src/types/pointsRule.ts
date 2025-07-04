// src/types/pointsRule.ts

/**
 * Tipos de regra de pontos.
 */
export enum RuleType {
  value_spent = "value_spent",
  event = "event",
  frequency = "frequency",
  category = "category",
  first_purchase = "first_purchase",
  recurrence = "recurrence",
  digital_behavior = "digital_behavior",
  special_date = "special_date",
  geolocation = "geolocation",
  inventory = "inventory",
}

/**
 * Base de uma regra de pontos.
 */
export interface PointsRuleBase {
  name: string;
  description?: string;
  rule_type: RuleType;
  config: Record<string, any>;
  active: boolean;
  visible: boolean;
}

/**
 * Representação de leitura de uma regra de pontos.
 */
export interface PointsRuleRead extends PointsRuleBase {
  id: string;
  company_id: string;
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
}


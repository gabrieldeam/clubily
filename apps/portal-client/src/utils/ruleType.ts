// src/utils/ruleType.ts

import { RuleType } from '@/types/pointsRule';

/**
 * Mapeia cada RuleType para um label legível.
 */
export const ruleTypeLabels: Record<RuleType, string> = {
  [RuleType.value_spent]: 'Por Valor Gasto',
  [RuleType.event]: 'Por Evento',
  [RuleType.frequency]: 'Frequência',
  [RuleType.category]: 'Categoria',
  [RuleType.first_purchase]: 'Primeira Compra',
  [RuleType.recurrence]: 'Recorrência',
  [RuleType.digital_behavior]: 'Comportamento Digital',
  [RuleType.special_date]: 'Data Especial',
  [RuleType.geolocation]: 'Geolocalização',
  [RuleType.inventory]: 'Inventário',
};

/**
 * Retorna o label para um RuleType, ou o próprio key se não existir.
 */
export function getRuleTypeLabel(type: RuleType): string {
  return ruleTypeLabels[type] ?? type;
}

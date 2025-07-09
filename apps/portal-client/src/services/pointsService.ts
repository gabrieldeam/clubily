// src/services/pointsService.ts

import api from './api';
import type { PointsRuleRead, RuleStatusRead } from '@/types/pointsRule';

/**
 * Lista regras de pontos ativas e visíveis de uma empresa.
 * GET /points/rules/company/{company_id}
 */
export const listCompanyVisibleRules = (companyId: string) =>
  api.get<PointsRuleRead[]>(`/points/rules/company/${companyId}`);

/**
 * Verifica status de elegibilidade para uma regra específica.
 * POST /points/rules/{rule_id}/status
 */
export const checkRuleStatus = (ruleId: string) =>
  api.get<RuleStatusRead>(`/points/rules/${ruleId}/status`);
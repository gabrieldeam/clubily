// src/services/pointsService.ts

import api from './api';
import type { PointsRuleRead } from '@/types/pointsRule';

/**
 * Lista regras de pontos ativas e visíveis de uma empresa.
 * GET /points/rules/company/{company_id}
 */
export const listCompanyVisibleRules = (companyId: string) =>
  api.get<PointsRuleRead[]>(`/points/rules/company/${companyId}`);


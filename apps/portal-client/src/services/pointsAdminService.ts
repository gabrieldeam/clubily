// src/services/pointsAdminService.ts

import api from '../../../portal-company/src/services/api';
import type {
  PaginatedRules,
  PaginatedUserPointsTransactions
} from '@/types/pointsAdmin';

/**
 * Admin: lista global de regras de pontos (paginado)
 * GET /admin_point/rules?skip=&limit=
 */
export const listAllRules = (skip = 0, limit = 10) =>
  api.get<PaginatedRules>('/admin_point/admin/rules', {
    params: { skip, limit },
  });

/**
 * Admin: transações vinculadas a uma regra específica (paginado)
 * GET /admin_point/rules/{ruleId}/transactions?skip=&limit=
 */
export const listRuleTransactions = (
  ruleId: string,
  skip = 0,
  limit = 10
) =>
  api.get<PaginatedUserPointsTransactions>(
    `/admin_point/admin/rules/${ruleId}/transactions`,
    {
      params: { skip, limit },
    }
  );

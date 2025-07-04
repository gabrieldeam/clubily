// src/types/pointsAdmin.ts

import { RuleType } from '@/types/pointsRule';
import { UserPointsTxType } from '@/types/pointsUserWallet'; // já definido em /types/points

/**
 * Regra de pontos com dados da empresa (retorno do admin/rules)
 */
export interface PointsRuleWithCompany {
  id: string;
  company_id: string;
  company_name: string;
  name: string;
  description?: string;
  rule_type: RuleType;
  active: boolean;
  visible: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Paginação genérica de regras
 */
export interface PaginatedRules {
  total: number;
  skip: number;
  limit: number;
  items: PointsRuleWithCompany[];
}

/**
 * Transação de pontos (admin também usa o mesmo shape de usuário, mas com company_id/name)
 */
export interface AdminUserPointsTransactionRead {
  id: string;
  type: UserPointsTxType;
  amount: number;
  description?: string;
  rule_id?: string;
  company_id: string;
  company_name?: string;
  created_at: string;
}

/**
 * Paginação de transações de pontos
 */
export interface PaginatedUserPointsTransactions {
  total: number;
  skip: number;
  limit: number;
  items: AdminUserPointsTransactionRead[];
}

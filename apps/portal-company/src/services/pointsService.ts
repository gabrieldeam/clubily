import api from "./api";
import type {
  PointsRuleRead,
  PointsRuleCreate,
  PointsRuleUpdate,
} from "@/types/points";

/**
 * Lista todas as regras da empresa logada.
 * GET /points/rules
 */
export const listPointsRules = () =>
  api.get<PointsRuleRead[]>("/points/rules");

/**
 * Cria nova regra para a empresa logada.
 * POST /points/rules
 */
export const createPointsRule = (payload: PointsRuleCreate) =>
  api.post<PointsRuleRead>("/points/rules", payload);

/**
 * Busca detalhes de uma regra.
 * GET /points/rules/{rule_id}
 */
export const getPointsRule = (ruleId: string) =>
  api.get<PointsRuleRead>(`/points/rules/${ruleId}`);

/**
 * Atualiza uma regra existente.
 * PUT /points/rules/{rule_id}
 */
export const updatePointsRule = (
  ruleId: string,
  payload: PointsRuleUpdate
) =>
  api.put<PointsRuleRead>(`/points/rules/${ruleId}`, payload);

/**
 * Remove uma regra.
 * DELETE /points/rules/{rule_id}
 */
export const deletePointsRule = (ruleId: string) =>
  api.delete<void>(`/points/rules/${ruleId}`);

/**
 * Lista regras ativas visíveis para front.
 * GET /points/rules/active
 */
export const listActivePointsRules = () =>
  api.get<PointsRuleRead[]>("/points/rules/active");
import api from "./api";
import type {
  PointsRuleRead,
  PointsRuleCreate,
  PointsRuleUpdate,
  EvaluateRulePayload,
  EvaluateRuleResponse,
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
 * Avalia manualmente uma regra para um usuário.
 * POST /points/rules/{rule_id}/evaluate
 */
export const evaluatePointsRule = (
  ruleId: string,
  payload: EvaluateRulePayload
) =>
  api.post<EvaluateRuleResponse>(
    `/points/rules/${ruleId}/evaluate`,
    payload
  );

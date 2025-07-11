// src/types/purchase.ts

/**
 * Payload para avaliação de compras.
 */
export interface PurchasePayload {
  user_id: string;               // UUID do usuário
  amount: number;                // valor da compra
  product_categories?: string[]; // array de IDs de categoria
  purchased_items?: string[];    // array de IDs de item
  branch_id?: string | null;     // ID da filial (opcional)
  event?: string | null;         // evento (opcional)
}

/**
 * Breakdown individual por regra retornado pela API.
 * Ajuste os campos conforme seu serviço retorná-los.
 */
export interface RuleBreakdown {
  rule_id: string;
  awarded: number;
  // campos extras opcionais — mude `any` para `unknown`
  [key: string]: unknown;
}

/**
 * Resultado da avaliação de compra.
 */
export interface EvaluatePurchaseResult {
  total_awarded: number;
  breakdown: RuleBreakdown[];
}

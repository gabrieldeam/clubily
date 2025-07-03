// src/services/purchaseService.ts
import api from './api';
import type {
  PurchasePayload,
  EvaluatePurchaseResult,
} from '@/types/purchase';

/**
 * Envia uma compra para avaliação de regras de pontos.
 * POST /purchases/evaluate
 */
export const evaluatePurchase = (payload: PurchasePayload) =>
  api.post<EvaluatePurchaseResult>('/purchases/evaluate', payload);

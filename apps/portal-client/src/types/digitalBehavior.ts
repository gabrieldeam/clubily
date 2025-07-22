// src/types/digitalBehavior.ts
import type { CompanyBasic } from '@/types/company';

/**
 * Resposta do GET /digital-behavior/{slug}
 */
export interface DigitalBehaviorResponse {
  slug: string;
  name: string;
  description?: string;
  points: number;
  valid_from?: string;
  valid_to?: string;
  max_attributions: number;

  /** sub-objeto com os dados da empresa */
  company: CompanyBasic;
}

/**
 * Payload para disparar evento digital
 * Pode conter user_id (existente) ou phone/cpf para pré-cadastro.
 */
export interface DigitalBehaviorTriggerPayload {
  user_id?: string;
  phone?: string;
  cpf?: string;
}

/**
 * Response do POST trigger
 */
export interface DigitalBehaviorTriggerResponse {
  points_awarded: number;
}

// src/services/loyaltyService.ts
import api from './api';          // <- your configured Axios instance
import type {
  TemplateRead,
  InstanceRead,
  InstanceDetail,
  CodeResponse,
  RewardCodeResponse
} from '@/types/loyalty';

/* ---------------------------------------------------------------------- */
/*  Templates                                                             */
/* ---------------------------------------------------------------------- */

/**
 * List templates from a company (endpoint `GET /templates`)
 */
export const listTemplates = (
  companyId: string,
  page = 1,
  size = 20,
) => api.get<TemplateRead[]>('/loyalty/templates', {
  params: { company_id: companyId, page, size },
});

/**
 * Same list, but with the `/companies/{id}/loyalty/templates` path.
 * (Identical result; use whichever makes more sense in your screens.)
 */
export const listTemplatesByCompany = (
  companyId: string,
  page = 1,
  size = 20,
) => api.get<TemplateRead[]>(`/loyalty/companies/${companyId}/loyalty/templates`, {
  params: { page, size },
});

/* ---------------------------------------------------------------------- */
/*  Claim / code                                                          */
/* ---------------------------------------------------------------------- */

/**
 * User claims a new loyalty-card instance from a template.
 * POST /templates/{tpl_id}/claim
 */
export const claimLoyaltyCard = (tplId: string) =>
  api.post<InstanceRead>(`/loyalty/templates/${tplId}/claim`);

/**
 * Generate a one-time code to stamp the card in the POS.
 * POST /cards/{inst_id}/code
 */
export const generateStampCode = (instId: string) =>
  api.post<CodeResponse>(`/loyalty/cards/${instId}/code`);

/* ---------------------------------------------------------------------- */
/*  My cards                                                              */
/* ---------------------------------------------------------------------- */

/**
 * List logged-in user cards (with template & stamps included).
 * GET /cards
 */
export const listMyCards = (page = 1, size = 20) =>
  api.get<InstanceDetail[]>('/loyalty/cards', {
    params: { page, size },
  });

  /**
 * Dispara a geração de código para resgatar a recompensa
 * @param instId ID da instância do cartão
 * @param linkId ID do link de recompensa dentro do template
 * @returns dados do code + expiração
 */
export function generateRewardCode(
  instId: string,
  linkId: string
) {
  return api.post<RewardCodeResponse>(
    `/company_rewards/user/instances/${instId}/rewards/${linkId}/code`
  )
}
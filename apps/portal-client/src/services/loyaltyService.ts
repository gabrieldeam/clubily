// src/services/loyaltyService.ts
import api from './api';          // <- your configured Axios instance
import type {
  TemplateRead,
  InstanceRead,
  InstanceDetail,
  CodeResponse,
  RewardCodeResponse,
  CompletedCardAdmin,
  CompletedCardsParams,
  TemplateStatsAdmin, 
  TemplateStatsParams
} from '@/types/loyalty';
import type { CompanyBasic } from '@/types/company';

/* ---------------------------------------------------------------------- */
/*  Templates                                                             */
/* ---------------------------------------------------------------------- */

/**
 * List templates from a company (endpoint `GET /templates`)
 */
export const listActiveTemplates = (
  postalCode: string,
  radiusKm: number,
  page: number = 1,
  size: number = 20,
) =>
  api.get<TemplateRead[]>('/loyalty/templates/active', {
    params: {
      postal_code: postalCode,
      radius_km: radiusKm,
      page,
      size,
    },
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
export const listMyCards = (page = 1, size = 10) =>
  api.get<InstanceDetail[]>('/loyalty/cards', {
    params: { page, size },
  });

  /**
 * List logged-in user cards for a specific company.
 * GET /companies/{company_id}/cards
 */
export const listMyCardsByCompany = (
  companyId: string,
  page = 1,
  size = 20,
) =>
  api.get<InstanceDetail[]>(`/loyalty/companies/${companyId}/cards`, {
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


/**
 * List all companies for which the user has at least one card.
 * GET /user/companies-with-cards
 */
export const listCompaniesWithCards = () =>
  api.get<CompanyBasic[]>('/loyalty/user/companies-with-cards');


/**
 * Lista cartões de fidelidade CONCLUÍDOS na plataforma inteira.
 * Requer token de usuário com papel admin (usa `require_admin` no backend).
 *
 * GET /loyalty/platform/admin/loyalty/completed-cards
 */
export const listPlatformCompletedCards = (params: CompletedCardsParams = {}) =>
  api.get<CompletedCardAdmin[]>(
    '/loyalty/platform/admin/loyalty/completed-cards',
    { params }
  );


/** GET /loyalty/platform/admin/loyalty/templates-stats */
export const listPlatformTemplateStats = (params: TemplateStatsParams = {}) =>
  api.get<TemplateStatsAdmin[]>(
    '/loyalty/platform/admin/loyalty/templates-stats',
    { params }
  );
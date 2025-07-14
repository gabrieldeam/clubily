// src/services/companyRewardsService.ts
import api from './api';
import type {
  RewardRead,
  RewardCreate,
  RewardUpdate,
  LinkRead,
  LinkCreate,
} from '@/types/companyReward';

// ————————————————————————————————————————————————————————
// ENDPOINT BASE  (mantive /company_rewards porque o back usa esse prefixo)
const BASE = '/company_rewards/admin';

// ————————————————————————————————————————————————————————
// Helper: monta FormData para Reward
const buildRewardForm = (
  payload: RewardCreate | RewardUpdate,
): FormData => {
  const form = new FormData();

  form.append('name', payload.name);
  if (payload.description !== undefined && payload.description !== null) {
    form.append('description', payload.description);
  }
  form.append('secret', String(payload.secret));
  if (payload.stock_qty !== undefined && payload.stock_qty !== null) {
    form.append('stock_qty', String(payload.stock_qty));
  }
  if (payload.image) {
    // terceiro argumento define o nome do arquivo que chegará ao servidor
    form.append('image', payload.image, payload.image.name);
  }
  return form;
};

// ————————————————————————————————————————————————————————
// Rewards CRUD
export const createReward = (payload: RewardCreate) => {
  const form = buildRewardForm(payload);

  return api.post<RewardRead>(BASE, form, {
    // Não inclua boundary manualmente – o axios/browser faz isso
    headers: { 'Content-Type': 'multipart/form-data' },
    // Garante que o axios NÃO tente serializar o FormData
    transformRequest: (data) => data,
  });
};

export const listRewards = () => api.get<RewardRead[]>(BASE);

export const updateReward = (id: string, payload: RewardUpdate) => {
  const form = buildRewardForm(payload);

  return api.put<RewardRead>(`${BASE}/${id}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    transformRequest: (data) => data,
  });
};

export const deleteReward = (id: string) => api.delete<void>(`${BASE}/${id}`);

// ————————————————————————————————————————————————————————
// Associação recompensa ↔ template (JSON normal)
export const attachRewardToTemplate = (
  templateId: string,
  payload: LinkCreate,
) =>
  api.post<LinkRead>(
    `/company_rewards/admin/templates/${templateId}/attach`,
    payload,
  );

export const listTemplateRewards = (templateId: string) =>
  api.get<LinkRead[]>(
    `/company_rewards/admin/templates/${templateId}/rewards`,
  );

export const removeLink = (linkId: string) =>
  api.delete<void>(`/company_rewards/admin/link/${linkId}`);

// ————————————————————————————————————————————————————————
// Resgate via código – multipart com 1 único campo
export const redeemReward = (code: string) => {
  const form = new FormData();
  form.append('code', code);

  return api.post<{ message: string }>(
    `/company_rewards/admin/redeem`,
    form,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      transformRequest: (data) => data,
    },
  );
};

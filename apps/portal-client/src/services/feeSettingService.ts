// src/services/feeSettingService.ts
import api from './api';
import type {
  FeeSettingRead,
  FeeSettingCreate,
  FeeSettingUpdate,
} from '@/types/feeSetting';

const BASE_URL = '/admin/fee-settings';

/**
 * Lista todas as configurações de taxa de uma empresa
 */
export const listFeeSettings = (companyId: string) =>
  api.get<FeeSettingRead[]>(`${BASE_URL}/${companyId}`);

/**
 * Cria uma configuração de taxa para um tipo
 */
export const createFeeSetting = (
  companyId: string,
  payload: FeeSettingCreate
) => api.post<FeeSettingRead>(`${BASE_URL}/${companyId}`, payload);

/**
 * Insere ou atualiza parcialmente a taxa de um tipo (PATCH)
 */
export const patchFeeSetting = (
  companyId: string,
  settingType: string,
  payload: FeeSettingUpdate
) =>
  api.patch<FeeSettingRead>(
    `${BASE_URL}/${companyId}/${settingType}`,
    payload
  );
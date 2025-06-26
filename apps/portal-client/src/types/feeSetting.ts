// src/types/feeSetting.ts
export type SettingTypeEnum =
  | 'cashback'
  | 'points'
  | 'loyalty'
  // adicione outros tipos conforme definidos no backend
  ;

/**
 * Base para FeeSetting
 */
export interface FeeSettingBase {
  setting_type: SettingTypeEnum;  // Tipo de serviço
  fee_amount: number | null;      // Valor da taxa (ex: 0.10), null preserva valor atual
}

/**
 * Payload de criação de FeeSetting
 */
export interface FeeSettingCreate extends Omit<FeeSettingBase, 'fee_amount'> {
  fee_amount: number;
}

/**
 * Payload de atualização parcial (upsert)
 */
export interface FeeSettingUpdate {
  fee_amount?: number | null;    // Se omitido, mantém valor atual
}

/**
 * Leitura de FeeSetting
 */
export interface FeeSettingRead extends FeeSettingBase {
  id: string;
  company_id: string;
  created_at: string;  // ISO datetime
  updated_at: string;
}
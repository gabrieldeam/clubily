// src/utils/pixKeyTypeLabels.ts
import { PixKeyType } from '@/types/transferMethod';

export const pixKeyTypeLabels: Record<PixKeyType, string> = {
  [PixKeyType.PHONE]:  'Telefone',
  [PixKeyType.EMAIL]:  'E-mail',
  [PixKeyType.CPF]:    'CPF',
  [PixKeyType.CNPJ]:   'CNPJ',
  [PixKeyType.RANDOM]: 'Chave aleatória',
};

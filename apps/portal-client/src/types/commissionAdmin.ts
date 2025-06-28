// src/types/commissionAdmin.ts

import type { TransferMethodRead } from '@/types/transferMethod';

export type CommissionWithdrawalStatus =
  | 'pending'
  | 'approved'
  | 'rejected';
  
/** Dados básicos do usuário que solicitou o saque */
export interface UserBasicRead {
  id: string;
  name: string;
  email: string;
}

/** Representação de um saque de comissão */
export interface CommissionWithdrawalRead {
  id: string;
  amount: number;
  status: CommissionWithdrawalStatus;
  created_at: string;
  user: UserBasicRead;
  transfer_method: TransferMethodRead | null;
}
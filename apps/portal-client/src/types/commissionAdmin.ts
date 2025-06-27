// src/types/commissionAdmin.ts
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

/** Método de transferência (PIX, TED, etc.) */
export interface TransferMethodRead {
  id: string;
  type: string;             // ex: 'PIX', 'TED'
  details: Record<string, any>; // campos específicos, ex: chave PIX
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
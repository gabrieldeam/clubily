export interface CommissionBalance {
  balance: number;
}

export interface CommissionTxRead {
  id: string;
  type: string;
  amount: number;
  description?: string;
  created_at: string; // ISO date string
}

export interface PaginatedCommissionTx {
  total: number;
  skip: number;
  limit: number;
  items: CommissionTxRead[];
}

export interface CommissionWithdrawalCreate {
  amount: number;
  transfer_method_id: string;
}

export type CommissionWithdrawalStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface CommissionWithdrawalRead {
  id: string;
  amount: number;
  status: CommissionWithdrawalStatus;
  created_at: string; // ISO date string
  user: {
    id: string;
    name: string;
    email: string;
  };
  transfer_method?: {
    id: string;
    name: string;
    key_type: string;
    key_value: string;
    created_at: string;
  };
}

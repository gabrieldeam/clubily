// src/types/companyReward.ts

export interface RewardRead {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  image_url?: string;
  secret: boolean;
  stock_qty?: number;
  created_at: string;
  updated_at: string;
}

export interface RewardCreate {
  name: string;
  description?: string;
  secret: boolean;
  stock_qty?: number;
  image?: File;
}

export interface RewardUpdate {
  name: string;
  description?: string;
  secret: boolean;
  stock_qty?: number;
  image?: File;
}

export interface LinkRead {
  id: string;
  stamp_no: number;
  reward: RewardRead;
}

export interface LinkCreate {
  reward_id: string;
  stamp_no: number;
}
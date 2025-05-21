export type Role = 'admin' | 'user';

export interface UserRead {
  id: string;
  name: string;
  email: string;
  company_ids: string[];
  phone?: string;
  role: Role;
  pre_registered?: boolean;
}

export interface LeadCreate {
  company_id: string;
  phone?: string;
}

export interface PreRegisterResponse {
  msg: string;
}

export interface PreRegisteredResponse {
  pre_registered: boolean;
}
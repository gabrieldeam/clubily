// types/user.ts

import type {
   CompanyRead
} from './company';

export type Role = 'admin' | 'user';

export interface Address {
  id: string;
  street: string;
  city: string;
  // …
}

export interface UserRead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  /** Agora incluímos CPF */
  cpf: string;
  is_active: boolean;
  role: Role;
  created_at: string;
  accepted_terms: boolean;
  pre_registered: boolean;
  email_verified_at?: string;
  phone_verified_at?: string;
  addresses?: Address[];
  companies?: CompanyRead[];
}

export interface LeadCreate {
  company_id: string;
  email?: string;
  phone?: string;
}

export interface UserCreate {
  name: string;
  email: string;
  password: string;
  /** CPF é obrigatório no payload de cadastro */
  cpf: string;
  phone?: string;
  accepted_terms: boolean;
  company_id?: string;
}

export interface UserUpdate {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  /** Agora permitimos atualizar o CPF, opcional */
  cpf?: string;
  company_ids?: string[];
}

export interface Token {
  access_token: string;
}

export interface PreRegisteredResponse {
  pre_registered: boolean;
}

export interface MsgResponse {
  msg: string;
}

export interface LoginCredentials {
  identifier: string; // email ou telefone
  password: string;
}

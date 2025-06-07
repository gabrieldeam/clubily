// src/types/user.ts

export type Role = 'admin' | 'user';

export interface Address {
  id: string;
  street: string;
  city: string;
  // … outros campos de endereço
}

export interface Company {
  id: string;
  name: string;
  // … outros campos de company
}

export interface UserRead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cpf: string;
  is_active: boolean;
  role: Role;
  created_at: string;
  accepted_terms: boolean;
  pre_registered: boolean;
  email_verified_at?: string;
  phone_verified_at?: string;
  addresses?: Address[];
  companies?: Company[];
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
  phone: string;
  cpf: string;
  accepted_terms: boolean;
  company_id?: string;
}

/**
 * Campos opcionais para atualização parcial de perfil do usuário
 */
export interface UserUpdate {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
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


export interface ReferralCode {
  referral_code: string;
}
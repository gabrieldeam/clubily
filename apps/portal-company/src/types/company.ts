// src/types/company.ts

import type { CategoryRead } from './category';

export interface CompanyBase {
  name: string;
  email: string;
  phone: string;
  cnpj: string;
  street: string;
  city: string;
  state: string;
  number: string;
  neighborhood: string;
  complement?: string | null;
  postal_code: string;
  description?: string | null;
  online_url?: string;       // HttpUrl
  only_online: boolean;
}

export interface CompanyCreate extends CompanyBase {
  password: string;
  accepted_terms: boolean;
}

export interface CompanyRead extends CompanyBase {
  id: string;
  created_at: string;        // ISO date
  email_verified_at?: string | null;
  phone_verified_at?: string | null;
  email_verified: boolean;   // computed (se email_verified_at !== null)
  phone_verified: boolean;   // computed (se phone_verified_at !== null)
  is_active: boolean;
  logo_url?: string | null;
  categories: CategoryRead[];
}

export interface CompanyReadWithService extends CompanyRead {
  serves_address: boolean;
}

export interface CompanyLogin {
  identifier: string;     // e-mail ou telefone
  password: string;
}

export interface TokenResponse {
  access_token: string;
}

export interface CompanyStatus {
  is_active: boolean;
}

export interface CompanyUpdate {
  name?: string;
  email?: string;
  phone?: string;
  cnpj?: string;
  street?: string;
  city?: string;
  state?: string;
  number?: string;
  neighborhood?: string;
  complement?: string | null;
  postal_code?: string;
  description?: string | null;
  category_ids?: string[];     // lista de UUIDs como strings
  online_url?: string;
  only_online?: boolean;
}

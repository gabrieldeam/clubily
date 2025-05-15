import type { CategoryRead } from './category';

export interface CompanyBase {
  name: string;
  email: string;
  phone: string;
  cnpj: string;  
  street: string;
  city: string;
  state: string;
  postal_code: string;
  description: string;
}

export interface CompanyCreate extends CompanyBase {
  password: string;
  accepted_terms: boolean;
}

export interface CompanyRead extends CompanyBase {
  id: string;
  created_at: string;     // ISO date
  email_verified: boolean;
  phone_verified: boolean;
  is_active: boolean;
  logo_url: string;
  categories: [CategoryRead];
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
  phone?: string;
  cnpj?: string;
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  description?: string;
  category_ids?: string[];
}


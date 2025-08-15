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
  online_url?: string;
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
  email_verified: boolean;
  phone_verified: boolean;
  is_active: boolean;
  logo_url?: string | null;
  categories: CategoryRead[];

  // NOVO: categoria principal
  primary_category_id?: string | null;
  // Se sua API retornar o objeto expandido, pode expor também:
  primary_category?: CategoryRead | null;
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
  category_ids?: string[];     // se você atualizar as associadas em massa
  online_url?: string;
  only_online?: boolean;

  // Opcional: se decidir permitir update direto via PATCH
  primary_category_id?: string | null;
}

export interface ReferralRedeem {
  referral_code: string;
}

export interface ReferralRead {
  id: string;
  user_id: string;
  company_id: string;
  created_at: string;
}

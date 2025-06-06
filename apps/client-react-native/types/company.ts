// types/company.ts
import type { CategoryRead } from './category';

export interface CompanyFilter {
  city?: string;
  state?: string;
  postal_code?: string;
  street?: string;
}

export interface CompanyRead {
  id: string;
  name: string;
  email: string;
  phone: string;
  cnpj: string;
  street: string;
  city: string;
  state: string;
  number: string;
  neighborhood: string;
  complement?: string;
  postal_code: string;
  description?: string;
  online_url?: string;
  only_online: boolean;
  created_at: string;
  email_verified_at?: string | null;
  phone_verified_at?: string | null;
  is_active: boolean;
  logo_url?: string | null;
  categories: CategoryRead[];
  email_verified: boolean;
  phone_verified: boolean;
}

export interface CompanyReadWithService extends CompanyRead {
  serves_address: boolean;
}

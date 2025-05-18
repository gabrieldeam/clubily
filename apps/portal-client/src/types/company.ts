// src/types/company.ts
import type {
  CategoryRead
} from '@/types/category';

export interface CompanyFilter {
  city?: string;
  state?: string;
  postal_code?: string;
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
  postal_code: string;
  description?: string;
  created_at: string;
  email_verified_at?: string;
  phone_verified_at?: string;
  is_active: boolean;
  logo_url?: string;
  categories: CategoryRead[];
  // computed
  email_verified: boolean;
  phone_verified: boolean;
}


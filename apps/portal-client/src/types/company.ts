import type { CategoryRead } from '@/types/category';


export interface PaginationParams {
  page?: number;
  size?: number;  
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
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
  email_verified_at?: string;
  phone_verified_at?: string;
  is_active: boolean;
  logo_url?: string;
  categories: CategoryRead[];
  email_verified: boolean;
  phone_verified: boolean;
}

export interface CompanyReadWithService extends CompanyRead {
  serves_address: boolean;
}

export interface CompanyBasic {
  id: string;
  name: string;
  email: string;
  phone: string;
  cnpj: string;
  logo_url?: string | null;
  description?: string | null;
}
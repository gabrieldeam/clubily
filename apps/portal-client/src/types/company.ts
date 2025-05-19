import type { CategoryRead } from '@/types/category';

// filtros usados em toda busca “por localização”
export interface CompanyFilter {
  city?: string;
  state?: string;
  postal_code?: string;
  street?: string;       // ← adicionado
}

// o tipo base que você já tinha
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
  email_verified: boolean;
  phone_verified: boolean;
}

// novo tipo para o endpoint `/search-by-name`
export interface CompanyReadWithService extends CompanyRead {
  serves_address: boolean;
}

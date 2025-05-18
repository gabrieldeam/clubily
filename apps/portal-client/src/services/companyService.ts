// src/services/companyService.ts

import api from './api';
import type {
  CompanyRead,
  CompanyFilter,
} from '@/types/company';

// … outros imports e métodos já existentes …

/**
 * Pega os dados completos de uma empresa
 * GET /companies/{company_id}/info
 */
export const getCompanyInfo = (companyId: string) =>
  api.get<CompanyRead>(`/companies/${companyId}/info`);


/**
 * Busca empresas por localização (city/state/postal_code)
 * GET /companies/search
 */
export const searchCompanies = (filters: CompanyFilter = {}) =>
  api.get<CompanyRead[]>('/companies/search', { params: filters });

/**
 * Busca empresas por categoria e localização
 * GET /companies/search-by-category?category_id=…&city=…&state=…&postal_code=…
 */
export const searchCompaniesByCategory = (
  categoryId: string,
  filters: CompanyFilter = {}
) =>
  api.get<CompanyRead[]>('/companies/search-by-category', {
    params: { category_id: categoryId, ...filters },
  });

/**
 * Ativa uma empresa (admin)
 * POST /companies/{company_id}/activate
 */
export const activateCompany = (companyId: string) =>
  api.post<void>(`/companies/${companyId}/activate`);

/**
 * Desativa uma empresa (admin)
 * POST /companies/{company_id}/deactivate
 */
export const deactivateCompany = (companyId: string) =>
  api.post<void>(`/companies/${companyId}/deactivate`);

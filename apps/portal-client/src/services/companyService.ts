// src/services/companyService.ts

import api from './api';
import type {
  CompanyRead,
  CompanyFilter,
  CompanyReadWithService,
  PaginationParams,
  Page
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
 * Busca empresas por localização (city/state/postal_code)
 * GET /companies/search
 */
export const searchCompaniesAdmin = (
  params: CompanyFilter & PaginationParams = {}
) => api.get<Page<CompanyRead>>('/companies/searchAdmin', { params });

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

/**
 * Busca empresas por nome e informa se servem o endereço dado
 * GET /companies/search-by-name?name=…&city=…&street=…&postal_code=…
 */
export const searchCompaniesByName = (
  name: string,
  filters: CompanyFilter = {}
) =>
  api.get<CompanyReadWithService[]>('/companies/search-by-name', {
    params: { name, ...filters },
  });

/**
 * Retorna todas as empresas indicadas por um referral code.
 */
export const getCompaniesByReferralCode = (code: string) =>
  api.get<CompanyRead[]>(`/users/${code}/companies`);
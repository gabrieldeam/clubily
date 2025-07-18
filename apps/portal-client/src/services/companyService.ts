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
 * Retorna todas as empresas indicadas por um referral code.
 */
export const getCompaniesByReferralCode = (code: string) =>
  api.get<CompanyRead[]>(`/users/${code}/companies`);





















/**
 * Busca empresas por localização (city/state/postal_code)
 * GET /companies/search
 */
export const searchCompaniesAdmin = (
  params: CompanyFilter & PaginationParams = {}
) => api.get<Page<CompanyRead>>('/companies/searchAdmin', { params });




// 2) CLIENT: ativas + online / dentro do raio
export const searchCompanies = (
  postal_code: string,
  radius_km: number,
  page = 1,
  size = 10
) =>
  api.get<Page<CompanyRead>>('/companies/search', {
    params: { postal_code, radius_km, page, size },
  });

// 3) POR CATEGORIA + raio
export const searchCompaniesByCategory = (
  categoryId: string,
  postal_code: string,
  radius_km: number,
  page = 1,
  size = 10
) =>
  api.get<Page<CompanyRead>>('/companies/search-by-category', {
    params: { 
      category_id: categoryId, 
      postal_code, 
      radius_km,
      page,
      size,
    },
  });

// 4) POR NOME + raio + serves_address
export const searchCompaniesByName = (
  name: string,
  postal_code: string,
  radius_km: number,
  page = 1,
  size = 10
) =>
  api.get<Page<CompanyReadWithService>>('/companies/search-by-name', {
    params: { name, postal_code, radius_km, page, size },
  });
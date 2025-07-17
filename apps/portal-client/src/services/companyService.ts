// src/services/companyService.ts

import api from './api';
import type {
  CompanyRead,
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





















// 1) ADMIN: busca paginada, sem filtro de ativo/online
// GET /companies/searchAdmin?postal_code=…&radius_km=…&page=…&size=…
export const searchCompaniesAdmin = (
  postal_code: string,
  radius_km: number,
  pagination: PaginationParams = {}
) =>
  api.get<Page<CompanyRead>>('/companies/searchAdmin', {
    params: { postal_code, radius_km, ...pagination },
  });


// 2) CLIENT: só ativas + online ou dentro do raio
// GET /companies/search?postal_code=…&radius_km=…
export const searchCompanies = (
  postal_code: string,
  radius_km: number
) =>
  api.get<CompanyRead[]>('/companies/search', {
    params: { postal_code, radius_km },
  });


// 3) BUSCA POR CATEGORIA + raio
// GET /companies/search-by-category?category_id=…&postal_code=…&radius_km=…
export const searchCompaniesByCategory = (
  categoryId: string,
  postal_code: string,
  radius_km: number
) =>
  api.get<CompanyRead[]>('/companies/search-by-category', {
    params: { category_id: categoryId, postal_code, radius_km },
  });


// 4) BUSCA POR NOME + raio + flag serves_address
// GET /companies/search-by-name?name=…&postal_code=…&radius_km=…
export const searchCompaniesByName = (
  name: string,
  postal_code: string,
  radius_km: number
) =>
  api.get<CompanyReadWithService[]>('/companies/search-by-name', {
    params: { name, postal_code, radius_km },
  });
// services/companyService.ts
import api from './api';
import type {
  CompanyRead,
  CompanyFilter,
  CompanyReadWithService,
} from '../types/company';

// Dados completos de uma empresa
export const getCompanyInfo = (companyId: string) =>
  api.get<CompanyRead>(`/companies/${companyId}/info`);

// Busca por localização
export const searchCompanies = (filters: CompanyFilter = {}) =>
  api.get<CompanyRead[]>('/companies/search', {
    params: filters,
  });

// Busca por categoria + localização
export const searchCompaniesByCategory = (
  categoryId: string,
  filters: CompanyFilter = {}
) =>
  api.get<CompanyRead[]>('/companies/search-by-category', {
    params: { category_id: categoryId, ...filters },
  });

// Ativa / desativa (admin)
export const activateCompany = (companyId: string) =>
  api.post<void>(`/companies/${companyId}/activate`);

export const deactivateCompany = (companyId: string) =>
  api.post<void>(`/companies/${companyId}/deactivate`);

// Busca por nome + verifica endereço
export const searchCompaniesByName = (
  name: string,
  filters: CompanyFilter = {}
) =>
  api.get<CompanyReadWithService[]>('/companies/search-by-name', {
    params: { name, ...filters },
  });

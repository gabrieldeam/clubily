import api from './api';
import type {
  CompanyCreate,
  CompanyRead,
  CompanyLogin,
  TokenResponse,
  CompanyStatus,
  CompanyUpdate,
} from '@/types/company';
import type { UserRead } from '@/types/user';

// 1. Registro e verificação
export const registerCompany = (payload: CompanyCreate) =>
  api.post<CompanyRead>('/companies/register', payload);

export const verifyEmailCompany = (token: string) =>
  api.get<{ msg: string }>('/companies/verify-email', {
    params: { token },
  });

// 2. Autenticação
export const loginCompany = (credentials: CompanyLogin) =>
  api.post<TokenResponse>('/companies/login', credentials);

export const forgotPasswordCompany = (email: string) =>
  api.post<{ msg: string }>('/companies/forgot-password', null, {
    params: { email },
  });

export const resetPasswordCompany = (token: string, newPassword: string) =>
  api.post<TokenResponse>('/companies/reset-password', null, {
    params: { token, new_password: newPassword },
  });

// 3. Clientes da empresa
export const listCompanyClients = () =>
  api.get<UserRead[]>('/companies/clients');

// 4. Categorias vinculadas
export const addCategoryToCompany = (categoryId: string) =>
  api.post<void>(`/companies/categories/${categoryId}`);

// 5. Ativação / desativação
export const activateCompany = (companyId: string) =>
  api.post<void>(`/companies/${companyId}/activate`);

export const deactivateCompany = (companyId: string) =>
 api.post<void>(`/companies/${companyId}/deactivate`);

// 6. Logo
export const uploadCompanyLogo = (formData: FormData) =>
  api.post<{ logo_url: string }>('/companies/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// 7. Busca
export const searchCompanies = (filters: {
  city?: string;
  state?: string;
  postal_code?: string;
}) =>
  api.get<CompanyRead[]>('/companies/search', {
    params: filters,
  });

  /**
 * Pega os dados da empresa logada (ou falha com 401).
 */
export const getCurrentCompany = () => 
  api.get<CompanyRead>('/companies/me');


// Status público (GET /companies/{id}/status)
export const getCompanyStatus = (companyId: string) =>
  api.get<CompanyStatus>(`/companies/${companyId}/status`);

// Info pública (GET /companies/{id}/info)
export const getCompanyInfo = (companyId: string) =>
  api.get<CompanyRead>(`/companies/${companyId}/info`);

// Atualização parcial (PATCH /companies/{id})
export const updateCompany = (companyId: string, payload: CompanyUpdate) =>
  api.patch<CompanyRead>(`/companies/${companyId}`, payload);


/**
 * Encerra a sessão no servidor e limpa o cookie.
 */
export const logoutCompany = () =>
  api.post<void>('/companies/logout');
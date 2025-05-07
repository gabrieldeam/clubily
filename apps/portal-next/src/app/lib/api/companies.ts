// apps/portal-next/src/lib/api/companies.ts
import api from './client';

export interface CompanyCreate {
  name: string;
  email: string;
  phone: string;
  password: string;
  accepted_terms: boolean;
}
export interface CompanyLogin { identifier: string; password: string }
export interface CompanyRead {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  email_verified: boolean;
  phone_verified: boolean;
}
export interface TokenResponse { access_token: string }
export interface UserRead {
  id: string;
  name?: string;
  email?: string;
  company_ids: string[];
  phone?: string;
  role: 'admin' | 'user';
}

export const registerCompany = (payload: CompanyCreate) =>
  api.post<CompanyRead>('/companies/register', payload);

export const verifyEmailCompany = (token: string) =>
  api.get('/companies/verify-email', { params: { token } });

export const loginCompany = (data: CompanyLogin) =>
  api.post<TokenResponse>('/companies/login', data);

export const forgotPasswordCompany = (email: string) =>
  api.post('/companies/forgot-password', { email });

export const resetPasswordCompany = (token: string, new_password: string) =>
  api.post<TokenResponse>('/companies/reset-password', { token, new_password });

export const listCompanyClients = () =>
  api.get<UserRead[]>('/companies/clients');

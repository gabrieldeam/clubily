// apps/portal-next/src/lib/api/auth.ts
import api from './client';

export interface LeadCreate { phone?: string; company_id: string }
export interface PreRegisteredParams { email?: string; phone?: string; company_id: string }
export interface UserCreate {
  name: string;
  email: string;
  password: string;
  company_ids?: string[];
  phone?: string;
  role?: 'admin' | 'user';
  accepted_terms: boolean;
}
export interface LoginData { identifier: string; password: string }
export interface TokenResponse { access_token: string }

export const preRegister = (payload: LeadCreate) =>
  api.post('/auth/pre-register', payload);

export const isPreRegistered = (params: PreRegisteredParams) =>
  api.get<{ pre_registered: boolean }>('/auth/pre-registered', { params });

export const register = (payload: UserCreate) =>
  api.post<TokenResponse>('/auth/register', payload);

export const login = (credentials: LoginData) =>
  api.post<TokenResponse>('/auth/login', credentials);

export const forgotPassword = (email: string) =>
  api.post('/auth/forgot-password', { email });

export const verifyEmail = (token: string) =>
  api.get('/auth/verify', { params: { token } });

export const requestPhoneCode = (phone: string) =>
  api.post('/auth/request-phone-code', { phone });

export const verifyPhoneCode = (phone: string, code: string) =>
  api.post<TokenResponse>('/auth/verify-phone-code', { phone, code });

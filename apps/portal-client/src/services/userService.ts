// src/services/userService.ts

import api from './api';
import type {
  UserRead,
  LeadCreate,
  UserCreate,
  UserUpdate,
  Token as TokenResponse,
  PreRegisteredResponse,
  MsgResponse,
  LoginCredentials,
  ReferralCode,
  PaginatedUsers
} from '@/types/user';

import type { CompanyRead } from '@/types/company';

// 1. Perfil
export const getCurrentUser = () =>
  api.get<UserRead>('/users/me');

// 1.1. Atualização parcial do perfil
export const updateCurrentUser = (payload: UserUpdate) =>
  api.patch<UserRead>('/users/me', payload);

// 2. Pré-cadastro (lead)
export const preRegisterUser = (payload: LeadCreate) =>
  api.post<MsgResponse>('/auth/pre-register', payload);

export const isPreRegisteredUser = (
  company_id: string,
  email?: string,
  phone?: string
) =>
  api.get<PreRegisteredResponse>('/auth/pre-registered', {
    params: { company_id, email, phone },
  });

// 3. Registro e verificação
export const registerUser = (payload: UserCreate) =>
  api.post<TokenResponse>('/auth/register', payload);

export const verifyEmailUser = (token: string) =>
  api.get<MsgResponse>('/auth/verify', {
    params: { token },
  });

// 4. Autenticação
export const loginUser = (credentials: LoginCredentials) =>
  api.post<TokenResponse>('/auth/login', credentials);

export const forgotPasswordUser = (email: string) =>
  api.post<MsgResponse>('/auth/forgot-password', null, {
    params: { email },
  });


export const resetPasswordUser = (token: string, newPassword: string) =>
api.post<TokenResponse>('/auth/reset-password', null, {
  params: { token, new_password: newPassword },
});

// 5. SMS (Twilio Verify)
export const requestPhoneCodeUser = (phone: string) =>
  api.post<MsgResponse>('/auth/request-phone-code', null, {
    params: { phone },
  });

export const verifyPhoneCodeUser = (phone: string, code: string) =>
  api.post<TokenResponse>('/auth/verify-phone-code', null, {
    params: { phone, code },
  });


  // 6. Logout
/**
 * Encerra a sessão do usuário limpando o cookie.
 */
export const logoutUser = () =>
  api.post<void>('/auth/logout');


/**
 * Lista as empresas vinculadas ao usuário logado, paginadas
 * GET /users/me/companies?page=1&page_size=10
 */
export const getMyCompanies = (
  page = 1,
  page_size = 10
) =>
  api.get<CompanyRead[]>('/users/me/companies', {
    params: { page, page_size }
  });
  
/**
 * Solicita exclusão de conta para o usuário logado
 * POST /users/me/delete-request
 */
export const requestUserDeletion = () =>
  api.post<MsgResponse>('/users/me/delete-request');

/**
 * Cria um referral code para o usuário logado.
 * POST /users/me/referral-code
 */
export const createMyReferralCode = () =>
  api.post<ReferralCode>('/users/me/referral-code');

/**
 * Recupera o referral code do usuário logado.
 * GET /users/me/referral-code
 */
export const getMyReferralCode = () =>
  api.get<ReferralCode>('/users/me/referral-code');


/**
 * Lista todos os usuários com paginação (admin)
 */
export const listUsers = (
  skip = 0,
  limit = 10
) => api.get<PaginatedUsers>('/users/admin', {
  params: { skip, limit }
});
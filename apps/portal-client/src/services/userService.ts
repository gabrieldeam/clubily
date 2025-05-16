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
} from '@/types/user';

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
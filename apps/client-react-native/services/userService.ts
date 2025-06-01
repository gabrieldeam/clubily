// services/userService.ts
import api from './api';
import type {
  UserRead,
  UserCreate,
  UserUpdate,
  Token as TokenResponse,
  MsgResponse,
  LoginCredentials,
} from '../types/user';
import type { CompanyRead } from '../types/company';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const setAuthHeader = (token?: string) => {
  if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete api.defaults.headers.common['Authorization'];
};

// 1. Perfil
export const getCurrentUser = () =>
  api.get<UserRead>('/users/me');

export const updateCurrentUser = (payload: UserUpdate) =>
  api.patch<UserRead>('/users/me', payload);

// 1.1. Solicitar exclusão de conta
export const requestUserDeletion = () =>
  api.post<MsgResponse>('/users/me/delete-request');

// 3. Registro & verificação
export const registerUser = (payload: UserCreate) =>
  api.post<TokenResponse>('/auth/register', payload);

export const verifyEmailUser = (token: string) =>
  api.get<MsgResponse>('/auth/verify', { params: { token } });

// 4. Login / senha
export const loginUser = async (credentials: LoginCredentials) => {
  const resp = await api.post<TokenResponse>('/auth/login', credentials);
  const token = resp.data.access_token;
  await AsyncStorage.setItem('jwt', token);
  setAuthHeader(token);
  return resp;
};

export const forgotPasswordUser = (email: string) =>
  api.post<MsgResponse>('/auth/forgot-password', null, {
    params: { email },
  });

export const resetPasswordUser = (token: string, newPassword: string) =>
  api.post<TokenResponse>('/auth/reset-password', null, {
    params: { token, new_password: newPassword },
  });

// 5. SMS (Twilio)
export const requestPhoneCodeUser = (phone: string) =>
  api.post<MsgResponse>('/auth/request-phone-code', null, {
    params: { phone },
  });

export const verifyPhoneCodeUser = (phone: string, code: string) =>
  api.post<TokenResponse>('/auth/verify-phone-code', null, {
    params: { phone, code },
  });

// 6. Logout
export const logoutUser = async () => {
  await AsyncStorage.removeItem('jwt');
  setAuthHeader(); 
};

// 7. Empresas do usuário (paginado)
export const getMyCompanies = (
  page = 1,
  page_size = 10
) =>
  api.get<CompanyRead[]>('/users/me/companies', {
    params: { page, page_size },
  });

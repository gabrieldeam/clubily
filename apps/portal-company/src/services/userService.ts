// src/services/userService.ts
import api from './api';
import type { LeadCreate, CheckPreRegisteredParams, UserRead } from '@/types/user';

/**
 * Pré-cadastra ou atualiza lead de usuário.
 * POST /auth/pre-register
 */
export const preRegister = (payload: LeadCreate) =>
  // antes: api.post<PreRegisterResponse>(...)
  api.post<UserRead>('/auth/pre-register', payload);

/**
 * Verifica se já existe pré-cadastro (lead) para este email/phone e empresa.
 * GET /auth/pre-registered?company_id=&email=&phone=
 */
export const checkPreRegistered = (params: CheckPreRegisteredParams) =>
  api.get<UserRead>('/auth/pre-registered', {
    params,
  });
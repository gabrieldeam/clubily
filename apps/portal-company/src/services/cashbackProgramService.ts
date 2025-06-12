// src/services/cashbackProgramService.ts
import api from './api';
import type {
  CashbackProgramCreate,
  CashbackProgramRead,
} from '@/types/cashbackProgram';

/**
 * Cria um novo programa de cashback para a empresa logada.
 * POST /companies/me/cashback-programs
 */
export const createCashbackProgram = (payload: CashbackProgramCreate) =>
  api.post<CashbackProgramRead>('/companies/me/cashback-programs', payload);

/**
 * Lista todos os programas de cashback da empresa logada.
 * GET /companies/me/cashback-programs
 */
export const getCashbackPrograms = () =>
  api.get<CashbackProgramRead[]>('/companies/me/cashback-programs');

/**
 * Detalha um programa da empresa logada.
 * GET /companies/me/cashback-programs/{program_id}
 */
export const getCashbackProgram = (programId: string) =>
  api.get<CashbackProgramRead>(`/companies/me/cashback-programs/${programId}`);

/**
 * Edita um programa da empresa logada.
 * PUT /companies/me/cashback-programs/{program_id}
 */
export const updateCashbackProgram = (
  programId: string,
  payload: CashbackProgramCreate
) =>
  api.put<CashbackProgramRead>(
    `/companies/me/cashback-programs/${programId}`,
    payload
  );

/**
 * Exclui um programa da empresa logada.
 * DELETE /companies/me/cashback-programs/{program_id}
 */
export const deleteCashbackProgram = (programId: string) =>
  api.delete<void>(`/companies/me/cashback-programs/${programId}`);

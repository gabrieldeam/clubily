// src/services/cashbackProgramService.ts
import api from './api';
import type { PaginatedAdminPrograms, PaginatedAssociations } from '@/types/cashbackAdminProgram';

/**
 * Lista programas de cashback paginados para admin
 */
export const listAdminPrograms = (
  skip = 0,
  limit = 10
) => api.get<PaginatedAdminPrograms>(
  `/companies/me/cashback-programs/admin/cashback-programs`,
  { params: { skip, limit } }
);

/**
 * Lista paginada de associações de um programa de cashback
 */
export const listProgramAssociations = (
  programId: string,
  skip = 0,
  limit = 10
) => api.get<PaginatedAssociations>(
  `/companies/me/cashback-programs/admin/${programId}/associations`,
  { params: { skip, limit } }
);

import api from './api';
import type { CashbackProgramRead } from '@/types/cashbackProgram';

/**
 * Lista os programas públicos e ativos de UMA empresa específica.
 * GET  /cashback-programs/{company_id}/public
 */
export const listPublicCashbackProgramsByCompany = (companyId: string) =>
  api.get<CashbackProgramRead[]>(`/companies/me/cashback-programs/${companyId}/public`);
// src/services/walletService.ts

import api from './api';
import type {
  UserCashbackWalletRead,
  WalletSummary,
  WalletTransactionRead,
  WalletRead
} from '@/types/wallet';

/**
 * Lista todas as carteiras de cashback do usuário logado.
 * GET /wallet/cashback-wallets
 */
export const listMyWallets = () =>
  api.get<UserCashbackWalletRead[]>('/wallet/cashback-wallets');

/**
 * Detalha a carteira de cashback para uma empresa específica.
 * GET /wallet/cashback-wallets/{company_id}
 */
export const getMyCompanyWallet = (companyId: string) =>
  api.get<UserCashbackWalletRead>(`/wallet/cashback-wallets/${companyId}`);

/**
 * Resumo: total de saldo e número de carteiras do usuário logado.
 * GET /wallet/cashback-wallets/summary
 */
export const getWalletsSummary = () =>
  api.get<WalletSummary>('/wallet/cashback-wallets/summary');

/**
 * Lista apenas os débitos da carteira do usuário logado para uma empresa.
 * GET /wallet/debits?company_id=&skip=&limit=
 */
export const listWalletDebits = (
  companyId: string,
  skip = 0,
  limit = 50
) =>
  api.get<WalletTransactionRead[]>('/wallet/debits', {
    params: { company_id: companyId, skip, limit },
  });

/**
 * Busca (ou cria, se não existir) a carteira de pontos de uma empresa (admin).
 * GET /wallet/admin/{companyId}/balance
 */
export const getCompanyWallet = (companyId: string) =>
  api.get<WalletRead>(`/wallet/admin/${companyId}/balance`);
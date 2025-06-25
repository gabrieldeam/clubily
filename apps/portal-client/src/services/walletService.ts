// src/services/walletService.ts

import api from './api';
import type {
  UserCashbackWalletRead,
  WalletSummary
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

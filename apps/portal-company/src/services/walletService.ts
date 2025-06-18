// src/services/walletService.ts
import api from './api';
import type { WalletRead } from '@/types/wallet';

/**
 * Recupera (ou cria) a carteira da empresa logada.
 * GET /wallet
 */
export const getWallet = () =>
  api.get<WalletRead>('/wallet');
// src/services/pointsWalletService.ts
import api from './api'
import type { PointsBalance } from '@/types/pointsWallet'

/**
 * Recupera o saldo de pontos da empresa logada.
 * GET /points/balance
 */
export const getPointsBalance = () =>
  api.get<PointsBalance>('/points/balance')

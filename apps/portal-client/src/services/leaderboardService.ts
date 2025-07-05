// src/services/leaderboardService.ts

import api from './api';
import type { PaginatedLeaderboard } from '@/types/leaderboard';

/**
 * Ranking geral (lifetime points).
 * GET /leaderboard/overall?skip=&limit=
 */
export const getLeaderboardOverall = (skip = 0, limit = 20) =>
  api.get<PaginatedLeaderboard>('/leaderboard/overall', {
    params: { skip, limit },
  });

/**
 * Ranking de hoje.
 * GET /leaderboard/today?skip=&limit=
 */
export const getLeaderboardToday = (skip = 0, limit = 20) =>
  api.get<PaginatedLeaderboard>('/leaderboard/today', {
    params: { skip, limit },
  });

/**
 * Ranking de um mês específico (UTC).
 * GET /leaderboard/month/{year}/{month}?skip=&limit=
 */
export const getLeaderboardMonth = (
  year: number,
  month: number,
  skip = 0,
  limit = 20
) =>
  api.get<PaginatedLeaderboard>(
    `/leaderboard/month/${year}/${month}`,
    { params: { skip, limit } }
  );

// src/types/leaderboard.ts

/**
 * Um único item do ranking.
 */
export interface LeaderboardEntry {
  user_id: string;   // UUID do usuário
  name: string;      // nome do usuário
  points: number;    // pontos acumulados
}

/**
 * Paginação genérica do ranking.
 */
export interface PaginatedLeaderboard {
  total: number;                 // total de registros no ranking
  skip: number;                  // quantos registros foram pulados
  limit: number;                 // quantos registros vieram
  items: LeaderboardEntry[];     // lista de entradas do ranking
  generated_at: string;          // timestamp ISO de quando foi gerado
}

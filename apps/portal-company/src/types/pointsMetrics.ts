// src/types/pointsMetrics.ts

/** Métrica por regra */
export interface RuleMetricRead {
  rule_id: string;
  start_date: string; // "YYYY-MM-DD"
  end_date: string;   // "YYYY-MM-DD"
  total_awarded: number;
  transaction_count: number;
  unique_users: number;
  average_per_tx: number;
}

/** Métricas gerais de pontos */
export interface PointsMetricRead {
  start_date: string; // "YYYY-MM-DD"
  end_date: string;   // "YYYY-MM-DD"
  total_awarded: number;
  transaction_count: number;
  unique_users: number;
  average_per_tx: number;
}

/** Pontos concedidos diários */
export interface PointsByDay {
  day: string;           // ex: "2025-07-09"
  points_awarded: number;
}

/** Pontos resgatados diários */
export interface PointsRedeemedByDay {
  day: string;           // ex: "2025-07-09"
  points_redeemed: number;
}

/** Transações x usuários diários */
export interface TxUserStatsByDay {
  day: string;           // ex: "2025-07-09"
  tx_count: number;
  unique_users: number;
}

/** Média de pontos por transação diária */
export interface AvgPointsPerTxByDay {
  day: string;           // ex: "2025-07-09"
  avg_points: number;
}


export interface RuleTransactionRead {
  id: string;           // UUID
  user_id: string;      // UUID
  user_name: string;  
  amount: number;
  description?: string;
  created_at: string;   // ISO timestamp
}

export interface PaginatedRuleTransactions {
  total: number;
  skip: number;
  limit: number;
  items: RuleTransactionRead[];
}
// src/types/purchaseMetrics.ts

/** Série diária de compras (nº e receita) */
export interface SaleByDay {
  day: string;        // ex: "2025-07-09"
  num_purchases: number;
  revenue: number;
}

/** Métricas de compras */
export interface PurchaseMetricRead {
  start_date: string;             // "YYYY-MM-DD"
  end_date: string;               // "YYYY-MM-DD"
  total_purchases: number;
  total_sales: number;
  avg_ticket: number;
  unique_buyers: number;
  avg_purchases_per_user: number;
  sales_by_day: SaleByDay[];
}

/** Total de compras por usuário */
export interface PurchasesPerUser {
  user_id: string;
  purchase_count: number;
}

/** Receita por usuário */
export interface RevenuePerUser {
  user_id: string;
  total_spent: number;
}
// src/types/cashbackMetrics.ts

/**
 * Um ponto de dado (dia e valor) para os gráficos.
 */
export interface DataPoint {
  day: string;   // ISO date, ex: "2025-06-15"
  value: number;
}

/**
 * Estrutura de resposta do gráfico mensal.
 */
export interface MonthlyCharts {
  spend_by_day: DataPoint[];           // Gastos por dia
  cashback_value_by_day: DataPoint[];  // Valor de cashback gerado por dia
  cashback_count_by_day: DataPoint[];  // Quantas associações por dia
  new_users_by_day: DataPoint[];       // Usuários cadastrados por dia
}


export interface ProgramMetrics {
  program_id: string;
  name: string;
  total_cashback_value: number;
  usage_count: number;
  average_amount_spent: number;
  unique_user_count: number;
  average_uses_per_user: number;
  average_interval_days?: number;
  roi?: number;
}

export interface CompanyMetrics {
  company_id: string
  total_cashback_value: number
  total_amount_spent: number
  usage_count: number
  unique_user_count: number
  average_amount_spent_per_use: number
  average_uses_per_user: number
  generated_at: string // ISO date
}
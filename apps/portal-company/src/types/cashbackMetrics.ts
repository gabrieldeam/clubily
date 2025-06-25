// src/types/cashbackMetrics.ts

/**
 * Um ponto de dado (dia e valor) para os gráficos.
 */
export interface DataPoint {
  day: string;   // ISO date, ex: "2025-06-15"
  value: number;
}

/**
 * Estrutura de resposta do gráfico em um intervalo.
 */
export interface MonthlyCharts {
  spend_by_day: DataPoint[];           // Gastos (amount_spent) por dia
  cashback_value_by_day: DataPoint[];  // Valor de cashback gerado por dia
  cashback_count_by_day: DataPoint[];  // Quantas associações por dia
  new_users_by_day: DataPoint[];       // Usuários cadastrados por dia
}

/**
 * Métricas de cada programa.
 */
export interface ProgramMetrics {
  program_id: string;                  // UUID do programa
  name: string;                        // Nome do programa
  total_cashback_value: number;        // Soma de todos os cashbacks deste programa
  usage_count: number;                 // Total de associações (usos)
  average_amount_spent: number;        // Valor médio gasto por uso
  unique_user_count: number;           // Número de usuários distintos
  average_uses_per_user: number;       // Média de usos por usuário
  average_interval_days?: number;      // Intervalo médio entre usos (dias)
  roi?: number;                        // total_amount_spent / total_cashback_value
}

/**
 * Resumo consolidado da empresa.
 */
export interface CompanyMetrics {
  company_id: string;                   // UUID da empresa
  total_cashback_value: number;         // Soma de todos os valores de cashback
  total_amount_spent: number;           // Soma de todos os valores gastos
  usage_count: number;                  // Total de associações realizadas
  unique_user_count: number;            // Número de usuários diferentes
  average_amount_spent_per_use: number; // Valor médio gasto por associação
  average_uses_per_user: number;        // Média de usos por usuário
  generated_at: string;                 // Timestamp ISO da geração deste resumo
}

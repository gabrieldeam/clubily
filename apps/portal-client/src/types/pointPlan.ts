// src/types/pointPlan.ts

/** Dados para criar um plano de pontos */
export interface PointPlanCreate {
  name: string;
  subtitle?: string;
  description: string;
  recommended: boolean;
  price: number;
  points: number;
}

/** Dados para atualizar um plano de pontos */
export interface PointPlanUpdate {
  name?: string;
  subtitle?: string;
  description?: string;
  recommended?: boolean;
  price?: number;
}

/** Leitura de um plano de pontos */
export interface PointPlanRead {
  id: string;             // UUID
  name: string;
  subtitle?: string;
  description: string;
  recommended: boolean;
  price: number;
  points: number;
  created_at: string;     // ISO datetime
  updated_at: string;     // ISO datetime
}

/** Páginação de planos de pontos */
export interface PaginatedPointPlans {
  total: number;
  skip: number;
  limit: number;
  items: PointPlanRead[];
}

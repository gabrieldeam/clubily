// src/types/milestone.ts

export interface MilestoneBase {
  title: string
  description?: string | null
  points: number
  order?: number
  active?: boolean
}

export type MilestoneCreate = MilestoneBase
export type MilestoneUpdate = MilestoneBase

export interface MilestoneRead extends MilestoneBase {
  id: string
  image_url: string
  created_at: string
  updated_at: string
}

export interface PaginatedMilestone {
  total: number
  skip: number
  limit: number
  items: MilestoneRead[]
}

export interface UserMilestoneRead {
  milestone: MilestoneRead
  achieved_at: string
}

export interface NextMilestoneRead {
  milestone_id: string   // UUID
  title: string
  points: number         // pontos necessários
  image_url: string
  user_points: number    // pontos atuais do usuário
  remaining: number      // pontos faltantes
}

/** Listagem completa de marcos com status para o usuário logado */
export interface MilestoneStatusRead {
  id: string               // UUID
  title: string
  points: number
  image_url: string
  achieved: boolean
  achieved_at: string | null  // ISO-8601 ou null
}

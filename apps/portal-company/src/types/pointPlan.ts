export interface PointPlanBase {
  name: string
  subtitle?: string
  description: string
  recommended: boolean
  price: number
  points: number
}

export interface PointPlanRead extends PointPlanBase {
  id: string
  created_at: string   // ISO timestamp
  updated_at: string   // ISO timestamp
}

export interface PaginatedPointPlans {
  total: number
  skip: number
  limit: number
  items: PointPlanRead[]
}

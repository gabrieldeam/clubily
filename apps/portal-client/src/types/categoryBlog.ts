export interface Category {
  id: string
  name: string
  parent_id?: string
  children: Category[]
}

export interface CategoryCreate {
  name: string
  parent_id?: string | null
}

export interface Author {
  id: string
  name: string
  bio?: string
  avatar_url?: string
}

export interface CreateAuthor {
  name: string
  bio?: string
  avatar?: File | null
}

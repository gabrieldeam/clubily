// src/services/categoryBlogService.ts

import type { Category } from '@/types/categoryBlog'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_URL}/categories`)
  if (!res.ok) throw new Error('Erro ao buscar categorias')
  return res.json()
}

export async function fetchCategory(id: string): Promise<Category> {
  const res = await fetch(`${API_URL}/categories/${id}`)
  if (!res.ok) throw new Error('Erro ao buscar categoria')
  return res.json()
}

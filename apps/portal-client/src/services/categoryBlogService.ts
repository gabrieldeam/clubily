import type { Category, CategoryCreate } from '@/types/categoryBlog'

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

export async function createCategory(data: CategoryCreate): Promise<Category> {
  const res = await fetch(`${API_URL}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Erro ao criar categoria')
  return res.json()
}

export async function updateCategory(id: string, data: CategoryCreate): Promise<Category> {
  const res = await fetch(`${API_URL}/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Erro ao atualizar categoria')
  return res.json()
}

export async function deleteCategory(id: string): Promise<Category> {
  const res = await fetch(`${API_URL}/categories/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Erro ao excluir categoria')
  return res.json()
}

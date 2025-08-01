import { Author } from '@/types/author'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export async function fetchAuthors(): Promise<Author[]> {
  const res = await fetch(`${API_URL}/authors`)
  if (!res.ok) throw new Error('Erro ao buscar autores')
  return res.json()
}

export async function fetchAuthor(id: string): Promise<Author> {
  const res = await fetch(`${API_URL}/authors/${id}`)
  if (!res.ok) throw new Error('Autor não encontrado')
  return res.json()
}

export async function createAuthor(data: FormData): Promise<Author> {
  const res = await fetch(`${API_URL}/authors`, {
    method: 'POST',
    body: data,
  })
  if (!res.ok) throw new Error('Erro ao criar autor')
  return res.json()
}

export async function updateAuthor(id: string, data: FormData): Promise<Author> {
  const res = await fetch(`${API_URL}/authors/${id}`, {
    method: 'PUT',
    body: data,
  })
  if (!res.ok) throw new Error('Erro ao atualizar autor')
  return res.json()
}

export async function deleteAuthor(id: string): Promise<Author> {
  const res = await fetch(`${API_URL}/authors/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Erro ao deletar autor')
  return res.json()
}

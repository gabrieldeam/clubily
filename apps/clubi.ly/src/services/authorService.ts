// src/services/authorService.ts

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

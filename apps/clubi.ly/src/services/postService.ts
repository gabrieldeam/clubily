// src/services/postService.ts

import type { Post, PostPage } from '@/types/post'

const API_URL = process.env.NEXT_PUBLIC_API_URL!

export async function fetchPosts(params?: {
  page?: number
  page_size?: number
  author_id?: string
  category_id?: string
  q?: string
}): Promise<PostPage> {
  // Constrói URLSearchParams de forma explícita
  const searchParams = new URLSearchParams()
  if (params) {
    if (params.page !== undefined)       searchParams.set('page', String(params.page))
    if (params.page_size !== undefined)  searchParams.set('page_size', String(params.page_size))
    if (params.author_id)                searchParams.set('author_id', params.author_id)
    if (params.category_id)              searchParams.set('category_id', params.category_id)
    if (params.q)                        searchParams.set('q', params.q)
  }

  const query = searchParams.toString()
  const url = query ? `${API_URL}/posts?${query}` : `${API_URL}/posts`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Erro ao buscar posts')
  return res.json() // { items, page, page_size, total }
}

export async function fetchPost(id: string): Promise<Post> {
  const res = await fetch(`${API_URL}/posts/${id}`)
  if (!res.ok) throw new Error('Erro ao buscar post')
  return res.json()
}

export async function fetchPostBySlug(slug: string): Promise<Post> {
  const res = await fetch(
    `${API_URL}/posts/slug/${encodeURIComponent(slug)}`
  )
  if (!res.ok) {
    throw new Error(`Erro ao buscar post com slug "${slug}": ${res.status}`)
  }
  return res.json()
}

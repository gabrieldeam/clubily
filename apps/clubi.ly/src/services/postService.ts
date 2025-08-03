// src/services/PostService.ts

import type { Post, PostPage } from '@/types/post'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export async function fetchPosts(params?: {
  page?: number;
  page_size?: number;
  author_id?: string;
  category_id?: string;
  q?: string;
}): Promise<PostPage> {
  const query = new URLSearchParams(params as any).toString();
  const res = await fetch(`${API_URL}/posts?${query}`);
  if (!res.ok) throw new Error("Erro ao buscar posts");
  return res.json();  // aqui o backend deve estar retornando { items, page, page_size, total }
}


export async function fetchPost(id: string): Promise<Post> {
  const res = await fetch(`${API_URL}/posts/${id}`)
  if (!res.ok) throw new Error('Erro ao buscar post')
  return res.json()
}

// substitua ou complemente o seu fetchPost atual:
export async function fetchPostBySlug(slug: string): Promise<Post> {
  const res = await fetch(`${API_URL}/posts/slug/${encodeURIComponent(slug)}`)
  if (!res.ok) {
    throw new Error(`Erro ao buscar post com slug "${slug}": ${res.status}`)
  }
  return res.json()
}
import type { Post, PostCreate, PostUpdate, PostPage } from '@/types/post'

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

export function createPost(payload: PostCreate): Promise<Post>;
export function createPost(payload: FormData): Promise<Post>;
export async function createPost(
  payload: PostCreate | FormData
): Promise<Post> {
  const isForm = payload instanceof FormData;
  const res = await fetch(`${API_URL}/posts`, {
    method: "POST",
    headers: isForm
      ? {}
      : { "Content-Type": "application/json" },
    body: isForm ? payload : JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Falha ao criar post");
  return res.json();
}

export function updatePost(id: string, payload: PostUpdate): Promise<Post>;
export function updatePost(id: string, payload: FormData): Promise<Post>;
export async function updatePost(
  id: string,
  payload: PostUpdate | FormData
): Promise<Post> {
  const isForm = payload instanceof FormData;
  const res = await fetch(`${API_URL}/posts/${id}`, {
    method: "PUT",
    headers: isForm
      ? {}
      : { "Content-Type": "application/json" },
    body: isForm ? payload : JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Falha ao atualizar post");
  return res.json();
}

export async function deletePost(id: string): Promise<Post> {
  const res = await fetch(`${API_URL}/posts/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Erro ao excluir post')
  return res.json()
}

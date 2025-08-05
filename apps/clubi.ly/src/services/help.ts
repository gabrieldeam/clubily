// src/services/help.ts

import {
  HelpCategory,
  HelpPost,
  HelpPostPage,
  HelpCategoryTree
} from "@/types/help";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ─── Help Categories ─────────────────────────────

export async function fetchHelpCategories(): Promise<HelpCategory[]> {
  const res = await fetch(`${API_URL}/help/categories`);
  if (!res.ok) throw new Error("Erro ao buscar categorias de Help Center");
  return res.json();
}

export async function fetchHelpCategory(id: string): Promise<HelpCategory> {
  const res = await fetch(`${API_URL}/help/categories/${id}`);
  if (!res.ok) throw new Error("Erro ao buscar categoria");
  return res.json();
}

// 1) Lista apenas as categorias de nível 1 com seus filhos imediatos
export async function fetchHelpCategoryTree(): Promise<HelpCategory[]> {
  const res = await fetch(`${API_URL}/help/categories/tree`);
  if (!res.ok) throw new Error("Erro ao buscar árvore de categorias");
  return res.json();
}

// 2) Busca os posts de uma categoria (e de todas as suas subcategorias) limitados a `limit`
export async function fetchHelpPostsByCategoryTree(
  categoryId: string,
  limit: number = 5
): Promise<HelpPost[]> {
  const params = new URLSearchParams({ limit: String(limit) }).toString();
  const res = await fetch(
    `${API_URL}/help/categories/${encodeURIComponent(categoryId)}/posts?${params}`
  );
  if (!res.ok) throw new Error("Erro ao buscar posts por categoria");
  return res.json();
}

// 3) Retorna uma categoria + toda a sua árvore de subcategorias e posts
export async function fetchHelpCategoryFullTree(
  categoryId: string
): Promise<HelpCategoryTree> {
  const res = await fetch(
    `${API_URL}/help/categories/${encodeURIComponent(categoryId)}/tree`
  );
  if (!res.ok) throw new Error("Erro ao buscar árvore completa da categoria");
  return res.json();
}

// ─── Help Posts ──────────────────────────────────

export async function fetchHelpPosts(params?: {
  page?: number;
  page_size?: number;
  search?: string;          // ← adiciona aqui
}): Promise<HelpPostPage> {
  const queryObj: Record<string,string> = {
    page: String(params?.page ?? 1),
    page_size: String(params?.page_size ?? 10),
  };

  if (params?.search) {
    queryObj.search = params.search;
  }

  const query = new URLSearchParams(queryObj).toString();
  const res = await fetch(`${API_URL}/help/posts?${query}`);
  if (!res.ok) throw new Error("Erro ao buscar artigos de suporte");

  const items: HelpPost[] = await res.json();
  return {
    items,
    page: params?.page ?? 1,
    page_size: params?.page_size ?? items.length,
    total: items.length,
  };
}

export async function fetchHelpPost(id: string): Promise<HelpPost> {
  const res = await fetch(`${API_URL}/help/posts/${id}`);
  if (!res.ok) throw new Error("Erro ao buscar artigo");
  return res.json();
}

// em src/services/help.ts
export async function fetchHelpPostBySlug(slug: string): Promise<HelpPost> {
  const res = await fetch(`${API_URL}/help/posts/slug/${slug}`);
  if (!res.ok) throw new Error("Artigo não encontrado pelo slug");
  return res.json();
}


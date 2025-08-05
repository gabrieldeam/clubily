// src/services/help.ts

import {
  HelpCategory,
  HelpCategoryCreate,
  HelpCategoryUpdate,
  HelpPost,
  HelpPostCreate,
  HelpPostPage,
  HelpPostUpdate,
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

export async function createHelpCategory(
  payload: HelpCategoryCreate
): Promise<HelpCategory> {
  const res = await fetch(`${API_URL}/help/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Falha ao criar categoria");
  return res.json();
}

export async function updateHelpCategory(
  id: string,
  payload: HelpCategoryUpdate
): Promise<HelpCategory> {
  const res = await fetch(`${API_URL}/help/categories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Falha ao atualizar categoria");
  return res.json();
}

export async function deleteHelpCategory(id: string): Promise<HelpCategory> {
  const res = await fetch(`${API_URL}/help/categories/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Falha ao excluir categoria");
  return res.json();
}

// ─── Help Posts ──────────────────────────────────

export async function fetchHelpPosts(params?: {
  page?: number;
  page_size?: number;
}): Promise<HelpPostPage> {
  const query = new URLSearchParams({
    page: String(params?.page ?? 1),
    page_size: String(params?.page_size ?? 10),
  }).toString();

  const res = await fetch(`${API_URL}/help/posts?${query}`);
  if (!res.ok) throw new Error("Erro ao buscar artigos de suporte");

  // supondo que o backend devolva SÓ o array de posts:
  const items: HelpPost[] = await res.json();

  // aqui a gente empacota num objeto paginado
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

export async function fetchHelpPostBySlug(slug: string): Promise<HelpPost> {
  const res = await fetch(`${API_URL}/help/posts/slug/${encodeURIComponent(slug)}`);
  if (!res.ok) throw new Error("Artigo não encontrado pelo slug");
  return res.json();
}

export function createHelpPost(payload: HelpPostCreate): Promise<HelpPost>;
export function createHelpPost(payload: FormData): Promise<HelpPost>;
export async function createHelpPost(
  payload: HelpPostCreate | FormData
): Promise<HelpPost> {
  const isForm = payload instanceof FormData;
  const res = await fetch(`${API_URL}/help/posts`, {
    method: "POST",
    headers: isForm ? {} : { "Content-Type": "application/json" },
    body: isForm ? payload : JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Falha ao criar artigo");
  return res.json();
}

export function updateHelpPost(
  id: string,
  payload: HelpPostUpdate
): Promise<HelpPost>;
export function updateHelpPost(
  id: string,
  payload: FormData
): Promise<HelpPost>;
export async function updateHelpPost(
  id: string,
  payload: HelpPostUpdate | FormData
): Promise<HelpPost> {
  const isForm = payload instanceof FormData;
  const res = await fetch(`${API_URL}/help/posts/${id}`, {
    method: "PUT",
    headers: isForm ? {} : { "Content-Type": "application/json" },
    body: isForm ? payload : JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Falha ao atualizar artigo");
  return res.json();
}

export async function deleteHelpPost(id: string): Promise<HelpPost> {
  const res = await fetch(`${API_URL}/help/posts/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Erro ao excluir artigo");
  return res.json();
}

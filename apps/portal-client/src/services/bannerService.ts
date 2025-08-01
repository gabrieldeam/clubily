import type { Banner } from '@/types/banner'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export async function fetchBanners(): Promise<Banner[]> {
  const res = await fetch(`${API_URL}/banners`)
  if (!res.ok) throw new Error('Erro ao buscar banners')
  return res.json()
}

export async function fetchBanner(id: string): Promise<Banner> {
  const res = await fetch(`${API_URL}/banners/${id}`)
  if (!res.ok) throw new Error('Erro ao buscar banner')
  return res.json()
}

export async function createBanner(data: FormData): Promise<Banner> {
  const res = await fetch(`${API_URL}/banners`, {
    method: 'POST',
    body: data,
  })
  if (!res.ok) throw new Error('Erro ao criar banner')
  return res.json()
}

export async function updateBanner(id: string, data: FormData): Promise<Banner> {
  const res = await fetch(`${API_URL}/banners/${id}`, {
    method: 'PUT',
    body: data,
  })
  if (!res.ok) throw new Error('Erro ao atualizar banner')
  return res.json()
}

export async function deleteBanner(id: string): Promise<Banner> {
  const res = await fetch(`${API_URL}/banners/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Erro ao excluir banner')
  return res.json()
}

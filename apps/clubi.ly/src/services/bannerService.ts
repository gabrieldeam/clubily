// src/services/bannerService.ts

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


// src/services/categoryService.ts

import api from './api';
import type {
  CategoryPage
} from '@/types/category';

/**
 * Lista PÚBLICA (sem auth) paginada + busca opcional
 * GET /categories/public?page=&size=&q=
 */
export const listPublicCategories = (page = 1, size = 20, q?: string) => {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  if (q) params.set('q', q);
  return api.get<CategoryPage>(`/categories/public?${params.toString()}`);
};
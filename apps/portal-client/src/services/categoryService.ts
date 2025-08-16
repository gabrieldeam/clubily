// src/services/categoryService.ts

import api from './api';
import type {
  CategoryRead,
  CategoryCreate,
  CategoryUpdate,
  CategoryPage
} from '@/types/category';

/**
 * Lista todas as categorias
 * GET /categories
 */
export const listCategories = () =>
  api.get<CategoryRead[]>('/categories/');

/**
 * Lista categorias que têm pelo menos uma empresa,
 * filtradas por localização.
 * GET /categories/used?city=&state=&postal_code=
 */
export const listUsedCategories = (
  postalCode: string,
  radiusKm: number,
) =>
  api.get<CategoryRead[]>('/categories/used', {
    params: {
      postal_code: postalCode,
      radius_km: radiusKm,
    },
  });

/**
 * Cria uma nova categoria (FormData: name + image)
 * POST /categories
 */
export const createCategory = (payload: CategoryCreate) => {
  const fd = new FormData();
  fd.append('name', payload.name);
  fd.append('image', payload.image);
  if (payload.commission_percent !== undefined) {
    fd.append(
      'commission_percent',
      payload.commission_percent === null ? '' : String(payload.commission_percent)
    );
  }
  return api.post<CategoryRead>('/categories/', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const updateCategory = (categoryId: string, payload: CategoryUpdate) => {
  const fd = new FormData();
  if (payload.name !== undefined) fd.append('name', payload.name);
  if (payload.image) fd.append('image', payload.image);
  if (payload.commission_percent !== undefined) {
    fd.append(
      'commission_percent',
      payload.commission_percent === null ? '' : String(payload.commission_percent)
    );
  }
  return api.patch<CategoryRead>(`/categories/${categoryId}`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

/**
 * Vincula a categoria à empresa logada
 * POST /categories/{category_id}
 */
export const addCategoryToCompany = (categoryId: string) =>
  api.post<void>(`/categories/${categoryId}`);


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
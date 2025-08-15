// src/services/categoryService.ts
import api from './api';
import type { CategoryRead } from '@/types/category';

// Listar todas as categorias
export const listCategories = () => {
  return api.get<CategoryRead[]>('/categories');
};

// Associar uma categoria à empresa atual (204 no content)
export const addCategoryToCompany = (categoryId: string) => {
  return api.post<void>(`/categories/${categoryId}`);
};

// Definir categoria principal (204 no content)
// OBS: seu backend já garante que, ao marcar como principal, a categoria
// é associada à empresa se ainda não estiver.
export const setPrimaryCategory = (categoryId: string) => {
  return api.post<void>(`/categories/${categoryId}/primary`);
};

// Remover categoria principal (204 no content)
export const unsetPrimaryCategory = () => {
  return api.delete<void>('/categories/primary');
};

// services/categoryService.ts
import api from './api';
import type {
  CategoryRead,
  CategoryFilter,
} from '../types/category';

/**
 * Lista todas as categorias
 */
export const listCategories = () =>
  api.get<CategoryRead[]>('/categories');

/**
 * Lista categorias que têm pelo menos uma empresa, filtradas por localização.
 */
export const listUsedCategories = (filters: CategoryFilter = {}) =>
  api.get<CategoryRead[]>('/categories/used', {
    params: filters,
  });

/**
 * Vincula a categoria à empresa logada
 */
export const addCategoryToCompany = (categoryId: string) =>
  api.post<void>(`/categories/${categoryId}`);

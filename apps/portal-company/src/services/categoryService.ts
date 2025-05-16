import api from './api';
import type { CategoryRead } from '@/types/category';

export const listCategories = () => {
  return api.get<CategoryRead[]>('/categories');
};

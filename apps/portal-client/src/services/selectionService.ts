// src/services/selectionService.ts

import api from './api';
import type {
  SelectionType,
  SelectionItemCreate,
  SelectionItemRead,
  CategorySelectionRead,
  ProductSelectionRead,
} from '@/types/selection';

/**
 * Admin: criar seleção (produto ou categoria)
 * POST /admin/selections
 */
export const createSelection = (payload: SelectionItemCreate) =>
  api.post<SelectionItemRead>('/selections', payload);

/**
 * Admin: deletar seleção
 * DELETE /admin/selections?type=...&item_id=...
 */
export const deleteSelection = (type: SelectionType, itemId?: string) =>
  api.delete<void>('/selections', {
    params: { type, item_id: itemId },
  });

/**
 * Admin: obter seleção de categoria atual
 * GET /admin/selections/category
 */
export const getCategorySelection = () =>
  api.get<CategorySelectionRead>('/selections/category');

/**
 * Admin: listar todos produtos selecionados
 * GET /admin/selections/products
 */
export const listProductSelections = () =>
  api.get<ProductSelectionRead[]>('/selections/products');

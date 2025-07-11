// src/types/selection.ts

/**
 * Tipo de seleção: categoria ou produto
 */
export type SelectionType = 'category' | 'product';

/**
 * Payload para criação de uma seleção
 */
export interface SelectionItemCreate {
  type: SelectionType;
  item_id: string; // UUID
}

/**
 * Seleção criada retornada pelo servidor
 */
export interface SelectionItemRead {
  id: string;       // UUID da seleção
  type: SelectionType;
  item_id: string;  // UUID do item selecionado
  created_at: string; // ISO datetime
}

/**
 * Seleção de categoria atual
 */
export interface CategorySelectionRead {
  item_id: string;  // UUID da categoria selecionada
}

/**
 * Lista de produtos selecionados
 */
export interface ProductSelectionRead {
  item_id: string;  // UUID do produto selecionado
}

// src/types/inventoryItem.ts

/**
 * Resposta paginada de itens de inventário.
 */
export interface PaginatedInventoryItems {
  total: number;              // total de registros disponíveis
  skip: number;               // quantos foram pulados
  limit: number;              // quantos foram retornados
  items: InventoryItemRead[]; // lista de itens na página
}

/**
 * Campos compartilhados para criar/atualizar um item de inventário.
 */
export interface InventoryItemBase {
  sku: string;
  name: string;
  price: number;        // valor em reais (decimal)
  category_ids: string[]; // lista de UUIDs de categorias
}

/** Payload para criação de item. */
export type InventoryItemCreate = InventoryItemBase;

/** Payload para atualização de item. */
export type InventoryItemUpdate = InventoryItemBase;

/** Representação completa de um item retornado pela API. */
export interface InventoryItemRead extends InventoryItemBase {
  id: string;         // UUID do item
  company_id: string; // UUID da empresa
  created_at: string; // ISO datetime de criação
}

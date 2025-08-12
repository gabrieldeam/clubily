import type { ProductCategoryBasic } from './productCategory';

/** Resposta paginada de itens de inventário. */
export interface PaginatedInventoryItems {
  total: number;
  skip: number;
  limit: number;
  items: InventoryItemRead[];
}

/** Campos compartilhados para criar/atualizar um item de inventário. */
export interface InventoryItemBase {
  sku: string;
  name: string;
  price: number;          // decimal
  category_ids: string[]; // UUIDs de categorias
}

/** Payloads */
export type InventoryItemCreate = InventoryItemBase;
export type InventoryItemUpdate = InventoryItemBase;

/** Item completo retornado pela API. */
export interface InventoryItemRead extends InventoryItemBase {
  id: string;
  company_id: string;
  created_at: string;
  /** vindo do backend agora */
  categories?: ProductCategoryBasic[];
}

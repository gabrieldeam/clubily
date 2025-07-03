// src/services/inventoryItemService.ts
import api from "./api";
import type {
  InventoryItemRead,
  InventoryItemCreate,
  InventoryItemUpdate,
  PaginatedInventoryItems,
} from "@/types/inventoryItem";


/**
 * Lista itens de inventário paginados da empresa logada.
 * GET /inventory?skip={skip}&limit={limit}
 */
export const listInventoryItems = (skip = 0, limit = 10) =>
  api.get<PaginatedInventoryItems>("/inventory", {
    params: { skip, limit },
  });
  
/**
 * Cria um novo item de inventário.
 * POST /inventory
 */
export const createInventoryItem = (payload: InventoryItemCreate) =>
  api.post<InventoryItemRead>("/inventory", payload);

/**
 * Atualiza um item de inventário existente.
 * PUT /inventory/{item_id}
 */
export const updateInventoryItem = (
  itemId: string,
  payload: InventoryItemUpdate
) =>
  api.put<InventoryItemRead>(`/inventory/${itemId}`, payload);

/**
 * Remove um item de inventário.
 * DELETE /inventory/{item_id}
 */
export const deleteInventoryItem = (itemId: string) =>
  api.delete<void>(`/inventory/${itemId}`);

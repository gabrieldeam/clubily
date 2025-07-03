// src/services/inventoryItemService.ts
import api from "./api";
import type {
  InventoryItemRead,
  InventoryItemCreate,
  InventoryItemUpdate,
} from "@/types/inventoryItem";

/**
 * Lista todos os itens de inventário da empresa logada.
 * GET /inventory
 */
export const listInventoryItems = () =>
  api.get<InventoryItemRead[]>("/inventory");

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

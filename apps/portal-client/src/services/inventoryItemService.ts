// src/services/inventoryItemService.ts
import api from "./api";
import type {
  InventoryItemBasic,
} from "@/types/inventoryItem";

const BASE = "/inventory";


/**
 * Busca múltiplos itens por IDs (retorna somente id, name, sku)
 */
export async function getInventoryItemsByIds(ids: string[]) {
  if (!ids?.length) return [];
  const params = new URLSearchParams();
  ids.forEach((id) => params.append("ids", id));
  const { data } = await api.get<InventoryItemBasic[]>(`${BASE}/by-ids`, {
    params,
    paramsSerializer: (p) => p.toString(),
  });
  return data;
}

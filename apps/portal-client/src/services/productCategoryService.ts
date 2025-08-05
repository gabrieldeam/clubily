// src/services/productCategoryService.ts
import api from "./api";
import type {
  ProductCategoryBasic,
} from "@/types/productCategory";

const BASE = "/product-categories";


/**
 * Busca múltiplas categorias por IDs (retorna somente id e name)
 */
export async function getProductCategoriesByIds(ids: string[]) {
  if (!ids?.length) return [];
  const params = new URLSearchParams();
  ids.forEach((id) => params.append("ids", id));
  const { data } = await api.get<ProductCategoryBasic[]>(`${BASE}/by-ids`, {
    params,
    paramsSerializer: (p) => p.toString(),
  });
  return data;
}

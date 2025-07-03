// src/services/productCategoryService.ts
import api from "./api";
import type {
  ProductCategoryRead,
  ProductCategoryCreate,
  ProductCategoryUpdate,
  PaginatedProductCategories,
} from "@/types/productCategory";

/**
 * Lista categorias paginadas.
 * GET /product-categories?skip={skip}&limit={limit}
 */
export const listProductCategories = (skip = 0, limit = 10) =>
  api.get<PaginatedProductCategories>("/product-categories", {
    params: { skip, limit },
  });
  
/**
 * Cria nova categoria de produto.
 * POST /product-categories
 */
export const createProductCategory = (payload: ProductCategoryCreate) =>
  api.post<ProductCategoryRead>("/product-categories", payload);

/**
 * Atualiza uma categoria existente.
 * PUT /product-categories/{category_id}
 */
export const updateProductCategory = (
  categoryId: string,
  payload: ProductCategoryUpdate
) =>
  api.put<ProductCategoryRead>(`/product-categories/${categoryId}`, payload);

/**
 * Remove uma categoria.
 * DELETE /product-categories/{category_id}
 */
export const deleteProductCategory = (categoryId: string) =>
  api.delete<void>(`/product-categories/${categoryId}`);

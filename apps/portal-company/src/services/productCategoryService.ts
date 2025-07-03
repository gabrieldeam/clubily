// src/services/productCategoryService.ts
import api from "./api";
import type {
  ProductCategoryRead,
  ProductCategoryCreate,
  ProductCategoryUpdate,
} from "@/types/productCategory";

/**
 * Lista todas as categorias de produto da empresa logada.
 * GET /product-categories
 */
export const listProductCategories = () =>
  api.get<ProductCategoryRead[]>("/product-categories");

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

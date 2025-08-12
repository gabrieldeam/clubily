// src/types/productCategory.ts

export interface ProductCategoryBase {
  name: string;
  slug: string;
}

// Create/Update são aliases do Base, não interfaces vazias
export type ProductCategoryCreate = ProductCategoryBase;
export type ProductCategoryUpdate = ProductCategoryBase;

/** Entidade retornada pela API */
export interface ProductCategoryRead extends ProductCategoryBase {
  id: string;          // UUID
  company_id: string;  // UUID da empresa
  created_at: string;  // ISO datetime
}

/** Resposta paginada */
export interface PaginatedProductCategories {
  total: number;
  skip:  number;
  limit: number;
  items: ProductCategoryRead[];
}

export interface ProductCategoryBasic {
  id: string;
  name: string;
}
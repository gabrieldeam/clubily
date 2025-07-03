// src/types/productCategory.ts

export interface ProductCategoryBase {
  name: string;
  slug: string;
}

export interface ProductCategoryCreate extends ProductCategoryBase {}

export interface ProductCategoryUpdate extends ProductCategoryBase {}

/**
 * Representação completa de uma categoria retornada pela API
 */
export interface ProductCategoryRead extends ProductCategoryBase {
  id: string;          // UUID
  company_id: string;  // UUID da empresa
  created_at: string;  // ISO datetime
}

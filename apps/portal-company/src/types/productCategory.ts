export interface ProductCategoryBase {
  name: string;
  slug: string;
}

export interface ProductCategoryCreate  extends ProductCategoryBase {}
export interface ProductCategoryUpdate  extends ProductCategoryBase {}

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

// src/types/category.ts

export interface CategoryBase {
  name: string;
  image_url?: string | null;
  commission_percent?: number | null;
}



/** Categoria retornada pela API */
export interface CategoryRead extends CategoryBase {
  id: string;
}


/** Página pública de categorias */
export interface CategoryPage {
  items: CategoryRead[];
  total: number;
  page: number;
  size: number;
}

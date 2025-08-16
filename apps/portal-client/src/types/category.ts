// src/types/category.ts

export interface CategoryBase {
  name: string;
  /** URL pública para a imagem da categoria */
  image_url?: string | null;
  /** Percentual de comissão da categoria (0..100). Ex.: 12.5 = 12,5% */
  commission_percent?: number | null;
}

/** Usado para criar uma nova categoria (name + imagem obrigatória) */
export interface CategoryCreate {
  name: string;
  image: File;
  /** Opcional no create */
  commission_percent?: number | null;
}

/** Usado para editar categoria (name e/ou imagem opcionais) */
export interface CategoryUpdate {
  name?: string;
  image?: File;
  /** Para limpar no backend (NULL), envie `null` */
  commission_percent?: number | null;
}

/** Categoria retornada pela API */
export interface CategoryRead extends CategoryBase {
  id: string;
}

export interface CategoryFilter {
  city?: string;
  state?: string;
  postal_code?: string;
}

/** Página pública de categorias */
export interface CategoryPage {
  items: CategoryRead[];
  total: number;
  page: number;
  size: number;
}

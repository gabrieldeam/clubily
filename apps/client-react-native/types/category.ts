// types/category.ts

export interface CategoryBase {
  name: string;
  /** URL pública para a imagem da categoria */
  image_url?: string | null;
}

/** Usado para criar uma nova categoria (name + imagem obrigatória) */

/** Categoria retornada pela API */
export interface CategoryRead extends CategoryBase {
  id: string;
}

export interface CategoryFilter {
  city?: string;
  state?: string;
  postal_code?: string;
}

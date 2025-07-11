/* -------------------------------------------------------------------------- */
/*  TIPOS – Slide de vitrine / carrossel                                      */
/* -------------------------------------------------------------------------- */

/** Campos em comum (criação / edição / leitura) */
export interface SlideImageBase {
  title:  string;
  order:  number;      // posição no carrossel
  active: boolean;     // visível para usuários
}

/** Payload que o back recebe no CRUD – exceto arquivo */
export interface SlideImageCreate extends SlideImageBase {
  /** url gerada no servidor depois do upload */
  image_url: string;
}

/** Payload para PUT (admin) – imagem é opcional                   */
export interface SlideImageUpdate extends SlideImageBase {
  image_url?: string | null;
}

/** Objeto completo devolvido pela API */
export interface SlideImageRead extends SlideImageBase {
  id:         string;   // UUID
  image_url:  string;   // caminho público
  created_at: string;   // ISO
  updated_at?: string;  // ISO | null
}

/** Resposta paginada (admin) */
export interface PaginatedSlideImage {
  total: number;
  skip:  number;
  limit: number;
  items: SlideImageRead[];
}

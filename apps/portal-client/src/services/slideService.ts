import api from './api';
import type {
  SlideImageRead,
  PaginatedSlideImage,
} from '@/types/slide';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

/** Monta FormData para criação/edição (admin) */
function buildSlideForm(data: {
  title: string;
  order?: number;
  active?: boolean;
  image?: File | null;
}) {
  const form = new FormData();
  form.append('title',  data.title);
  form.append('order',  String(data.order ?? 0));
  form.append('active', String(data.active ?? true));
  if (data.image) form.append('image', data.image);
  return form;
}

/* -------------------------------------------------------------------------- */
/*  ADMIN – CRUD                                                              */
/* -------------------------------------------------------------------------- */

/** Criar slide  ▸ POST /slides  (admin) */
export const adminCreateSlide = (payload: {
  title: string;
  order?: number;
  active?: boolean;
  image: File;               // obrigatório
}) =>
  api.post<SlideImageRead>('/slides', buildSlideForm(payload), {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

/** Listar slides (paginado) ▸ GET /slides?skip&limit  (admin) */
export const adminListSlides = (skip = 0, limit = 10) =>
  api.get<PaginatedSlideImage>('/slides', { params: { skip, limit } });

/** Obter um slide ▸ GET /slides/{id}  (admin) */
export const adminGetSlide = (slideId: string) =>
  api.get<SlideImageRead>(`/slides/${slideId}`);

/** Editar slide ▸ PUT /slides/{id}  (admin) */
export const adminUpdateSlide = (
  slideId: string,
  payload: {
    title: string;
    order?: number;
    active?: boolean;
    /** passe `null` para manter a imagem atual */
    image?: File | null;
  },
) =>
  api.put<SlideImageRead>(
    `/slides/${slideId}`,
    buildSlideForm(payload),
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );

/** Excluir slide ▸ DELETE /slides/{id}  (admin) */
export const adminDeleteSlide = (slideId: string) =>
  api.delete<void>(`/slides/${slideId}`);

/* -------------------------------------------------------------------------- */
/*  USUÁRIO – listar todos os slides ativos                                   */
/* -------------------------------------------------------------------------- */

/** GET /slides/active – só exige user autenticado */
export const listActiveSlides = () =>
  api.get<SlideImageRead[]>('/slides/active');

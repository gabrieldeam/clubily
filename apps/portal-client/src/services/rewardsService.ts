import api from './api';
import type {
  RewardCategoryCreate,
  PaginatedRewardCategory,
  RewardProductCreate,
  PaginatedRewardProduct,
  RewardOrderCreate,
  PaginatedRewardOrder,
  RewardOrderRead,
  RewardProductRead,
  RewardCategoryRead,
  OrderStatus,
  RewardCategoryUpdate,
  RewardProductUpdate,
} from '@/types/reward';

/* ========== Categorias ========== */

// ► Admin – cria categoria
export const adminCreateRewardCategory = (payload: RewardCategoryCreate) =>
  api.post<RewardCategoryRead>('/rewards/admin/categories', payload);

// ► Todos – lista categorias (paginado)
export const listRewardCategories = (skip = 0, limit = 10) =>
  api.get<PaginatedRewardCategory>('/rewards/categories', { params: { skip, limit } });

/** Atualiza uma categoria de recompensa (admin) */
export const adminUpdateRewardCategory = (
  categoryId: string,
  payload: RewardCategoryUpdate,
) =>
  api.put<RewardCategoryRead>(
    `/rewards/admin/categories/${categoryId}`,
    payload,
  );

/** Remove uma categoria de recompensa (admin) */
export const adminDeleteRewardCategory = (categoryId: string) =>
  api.delete<void>(`/rewards/admin/categories/${categoryId}`);

/* ========== Produtos ========== */

// ► Admin – cria produto (multipart)
export const adminCreateRewardProduct = (data: RewardProductCreate & {
  image?: File | null;
  pdf?:   File | null;
}) => {
  const form = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (k === 'image' || k === 'pdf') {
      if (v) form.append(k, v as File);
    } else if (k === 'category_ids') {
      form.append(k, (v as string[]).join(','));
    } else {
      form.append(k, String(v));
    }
  });
  return api.post<RewardProductRead>('/rewards/admin/products', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// ► Todos – lista produtos (paginado)
export const listRewardProducts = (skip = 0, limit = 10) =>
  api.get<PaginatedRewardProduct>('/rewards/products', { params: { skip, limit } });

/** Atualiza um produto de recompensa (admin) */
export const adminUpdateRewardProduct = (
  productId: string,
  data: RewardProductUpdate & {
    image?: File | null;
    pdf?:   File | null;
  },
) => {
  const form = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (k === 'image' || k === 'pdf') {
      if (v) form.append(k, v as File);
    } else if (k === 'category_ids') {
      form.append(k, (v as string[]).join(','));
    } else {
      form.append(k, String(v));
    }
  });

  return api.put<RewardProductRead>(
    `/rewards/admin/products/${productId}`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
};

/** Exclui um produto de recompensa (admin) */
export const adminDeleteRewardProduct = (productId: string) =>
  api.delete<void>(`/rewards/admin/products/${productId}`);

/* ========== Pedidos (Usuário) ========== */

// ► cria pedido
export const makeRewardOrder = (payload: RewardOrderCreate) =>
  api.post<RewardOrderRead>('/rewards/orders', payload);

// ► lista meus pedidos
export const listMyRewardOrders = (skip = 0, limit = 10) =>
  api.get<PaginatedRewardOrder>('/rewards/orders', { params: { skip, limit } });

/* ========== Pedidos (Admin) ========== */

// ► lista pedidos de todos os usuários
export const adminListRewardOrders = (
  status?: OrderStatus,
  skip = 0,
  limit = 10
) =>
  api.get<PaginatedRewardOrder>('/rewards/admin/orders', {
    params: { status, skip, limit }
  });

// ► aprova pedido
export const adminApproveRewardOrder = (orderId: string) =>
  api.post<RewardOrderRead>(`/rewards/admin/orders/${orderId}/approve`);

// ► recusa pedido, informando motivo
export const adminRefuseRewardOrder = (orderId: string, reason: string) =>
  api.post<RewardOrderRead>(
    `/rewards/admin/orders/${orderId}/refuse`,
    { reason },
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

// src/services/milestoneService.ts
import api from './api'
import type {
  MilestoneCreate,
  MilestoneUpdate,
  MilestoneRead,
  PaginatedMilestone,
  UserMilestoneRead,
  NextMilestoneRead,
  MilestoneStatusRead
} from '@/types/milestone'
import type { AxiosResponse } from 'axios'

/**
 * Admin: cria um marco
 */
export function adminCreateMilestone(
  payload: MilestoneCreate,
  imageFile: File
): Promise<AxiosResponse<MilestoneRead>> {
  const form = new FormData()
  form.append('title', payload.title)
  if (payload.description != null) form.append('description', payload.description)
  form.append('points', String(payload.points))
  form.append('order', String(payload.order ?? 0))
  form.append('active', String(payload.active ?? true))
  form.append('image', imageFile)
  return api.post<MilestoneRead>('/milestones/admin', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

/**
 * Admin: lista marcos paginados
 */
export function adminListMilestones(
  skip = 0,
  limit = 20
): Promise<AxiosResponse<PaginatedMilestone>> {
  return api.get<PaginatedMilestone>('/milestones/admin', {
    params: { skip, limit }
  })
}

/**
 * Admin: atualiza um marco
 */
export function adminUpdateMilestone(
  id: string,
  payload: MilestoneUpdate,
  imageFile?: File
): Promise<AxiosResponse<MilestoneRead>> {
  const form = new FormData()
  form.append('title', payload.title)
  if (payload.description != null) form.append('description', payload.description)
  form.append('points', String(payload.points))
  form.append('order', String(payload.order ?? 0))
  form.append('active', String(payload.active ?? true))
  if (imageFile) form.append('image', imageFile)
  return api.put<MilestoneRead>(`/milestones/admin/${id}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

/**
 * Admin: deleta um marco
 */
export function adminDeleteMilestone(id: string): Promise<AxiosResponse<void>> {
  return api.delete(`/milestones/admin/${id}`)
}

/**
 * Usuário: obtém seus marcos conquistados
 */
export function getMyMilestones(): Promise<AxiosResponse<UserMilestoneRead[]>> {
  return api.get<UserMilestoneRead[]>('/milestones/my')
}

/* ------------------------------------------------------------------
 * USUÁRIO – próximo marco
 * GET /milestones/next
 * -----------------------------------------------------------------*/
export function getNextMilestone(): Promise<AxiosResponse<NextMilestoneRead>> {
  return api.get<NextMilestoneRead>('/milestones/next');
}

/* ------------------------------------------------------------------
 * USUÁRIO – todos os marcos com status
 * GET /milestones/all
 * -----------------------------------------------------------------*/
export function getAllMilestonesStatus(): Promise<AxiosResponse<MilestoneStatusRead[]>> {
  return api.get<MilestoneStatusRead[]>('/milestones/all');
}

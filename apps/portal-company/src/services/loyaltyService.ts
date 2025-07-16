// src/services/loyaltyService.ts
import api from './api'
import type {
  RuleCreate,
  RuleRead,
  TemplateCreate,
  TemplateRead,
  TemplateUpdate,
  InstanceRead,
  StampRequest,
  Paginated,
  InstanceAdminDetail
} from '@/types/loyalty'
import type { AxiosResponse } from 'axios'

/* ───────── Templates ────────────────────────────────────────── */

export function adminCreateTemplate(
  payload: TemplateCreate,
  iconFile?: File
): Promise<AxiosResponse<TemplateRead>> {
  const form = new FormData()
  form.append('title', payload.title)
  if (payload.promo_text)      form.append('promo_text', payload.promo_text)
  form.append('stamp_total',    String(payload.stamp_total))
  if (payload.emission_limit !== undefined && payload.emission_limit !== null)
    form.append('emission_limit', String(payload.emission_limit))
  if (payload.color_primary)    form.append('color_primary', payload.color_primary)
  if (payload.color_bg)         form.append('color_bg', payload.color_bg)
  form.append('per_user_limit', String(payload.per_user_limit ?? 1))

  // envio direto da string ISO
  if (payload.emission_start)   form.append('emission_start', payload.emission_start)
  if (payload.emission_end)     form.append('emission_end',   payload.emission_end)

  form.append('active',         String(payload.active ?? true))

  // o nome exato deve bater com o parametro do FastAPI: stamp_icon
  if (iconFile)                 form.append('stamp_icon', iconFile)

  return api.post('/loyalty/admin/templates', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

/** Empresa: atualizar template de cartão */
export function adminUpdateTemplate(
  id: string,
  payload: TemplateUpdate,
  iconFile?: File
): Promise<AxiosResponse<TemplateRead>> {
  const form = new FormData()
  form.append('title', payload.title)
  if (payload.promo_text)      form.append('promo_text', payload.promo_text)
  form.append('stamp_total',    String(payload.stamp_total))
  if (payload.emission_limit !== undefined && payload.emission_limit !== null)
    form.append('emission_limit', String(payload.emission_limit))
  if (payload.color_primary)    form.append('color_primary', payload.color_primary)
  if (payload.color_bg)         form.append('color_bg', payload.color_bg)
  form.append('per_user_limit', String(payload.per_user_limit ?? 1))

  if (payload.emission_start)   form.append('emission_start', payload.emission_start)
  if (payload.emission_end)     form.append('emission_end',   payload.emission_end)

  form.append('active',         String(payload.active ?? true))

  if (iconFile)                 form.append('stamp_icon', iconFile)

  return api.put(`/loyalty/admin/templates/${id}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}


/** Empresa: listar templates */
export const adminListTemplates = () =>
  api.get<TemplateRead[]>('/loyalty/admin/templates')

/** Empresa: obter template pelo ID */
export const adminGetTemplate = (id: string) =>
  api.get<TemplateRead>(`/loyalty/admin/templates/${id}`)

/** Empresa: deletar template */
export const adminDeleteTemplate = (id: string) =>
  api.delete<void>(`/loyalty/admin/templates/${id}`)

/* ───────── Regras ───────────────────────────────────────────── */

export const adminListRules  = (tplId: string) =>
  api.get<RuleRead[]>(`/loyalty/admin/templates/${tplId}/rules`)

export const adminGetRule    = (tplId: string, ruleId: string) =>
  api.get<RuleRead>(`/loyalty/admin/templates/${tplId}/rules/${ruleId}`)

export const adminAddRule    = (tplId: string, data: RuleCreate) =>
  api.post<RuleRead>(`/loyalty/admin/templates/${tplId}/rules`, data)

export const adminUpdateRule = (tplId: string, ruleId: string, data: RuleCreate) =>
  api.put<RuleRead>(`/loyalty/admin/templates/${tplId}/rules/${ruleId}`, data)

export const adminDeleteRule = (tplId: string, ruleId: string) =>
  api.delete<void>(`/loyalty/admin/templates/${tplId}/rules/${ruleId}`)

/* ───────── Instâncias / carimbar ────────────────────────────── */

/** Empresa: carimbar cartão via código */
export function adminStampCard(
  payload: StampRequest
): Promise<AxiosResponse<InstanceRead>> {
  return api.post<InstanceRead>('/loyalty/admin/stamp', payload);
}

export interface InstanceFilters {
  page?: number;
  page_size?: number;
  status?: 'active' | 'completed';
  missing_leq?: number;
  expires_within?: number;
}

export async function getTemplateInstances(
  templateId: string,
  filters: InstanceFilters = {}
): Promise<Paginated<InstanceAdminDetail>> {
  const res = await api.get<InstanceAdminDetail[]>(
    `/loyalty/admin/templates/${templateId}/instances`,
    { params: filters }
  )

  return {
    data: res.data,
    total: Number(res.headers['x-total-count']),
    page: Number(res.headers['x-page']),
    pageSize: Number(res.headers['x-page-size']),
  }
}
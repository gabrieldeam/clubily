// src/services/loyaltyService.ts
import api from './api'
import type {
  RuleCreate,
  RuleRead,
  TemplateCreate,
  TemplateRead,
  TemplateReadFull,
  TemplateUpdate,
  InstanceRead,
  StampRequest,
  Paginated,
  InstanceAdminDetail,
  IssueForUserPayload,
  StampData,
  AdminCompanyInstanceFilters,
  InstanceDetail,
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
  api.get<TemplateReadFull[]>('/loyalty/admin/templates')

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





/** Empresa: carimbar DIRETO uma instância (sem código) */
export function adminStampCardDirect(
  instanceId: string,
  data?: StampData,
  force = false
): Promise<AxiosResponse<InstanceRead>> {
  return api.post<InstanceRead>(
    `/loyalty/admin/cards/${instanceId}/stamp`,
    data ?? {},
    { params: { force } }
  )
}

/** Empresa: carimbar o cartão ativo de um usuário num template (auto_issue opcional) */
export function adminStampUserTemplate(
  templateId: string,
  userId: string,
  data?: StampData,
  opts?: { autoIssue?: boolean; force?: boolean }
): Promise<AxiosResponse<InstanceRead>> {
  const params = {
    auto_issue: opts?.autoIssue ?? false,
    force: opts?.force ?? false,
  }
  return api.post<InstanceRead>(
    `/loyalty/admin/templates/${templateId}/users/${userId}/stamp`,
    data ?? {},
    { params }
  )
}

/** Empresa: listar cartões emitidos da empresa (todos os templates) */
export async function getCompanyInstances(
  filters: AdminCompanyInstanceFilters = {}
): Promise<Paginated<InstanceAdminDetail>> {
  const res = await api.get<InstanceAdminDetail[]>(
    '/loyalty/admin/cards',
    { params: filters }
  )
  return {
    data: res.data,
    total: Number(res.headers['x-total-count']),
    page: Number(res.headers['x-page']),
    pageSize: Number(res.headers['x-page-size']),
  }
}

/** Empresa: listar cartões de um usuário (dentro da empresa logada) */
export async function getUserCompanyInstances(
  userId: string,
  filters: InstanceFilters = {}
): Promise<Paginated<InstanceAdminDetail>> {
  const res = await api.get<InstanceAdminDetail[]>(
    `/loyalty/admin/users/${userId}/cards`,
    { params: filters }
  )
  return {
    data: res.data,
    total: Number(res.headers['x-total-count']),
    page: Number(res.headers['x-page']),
    pageSize: Number(res.headers['x-page-size']),
  }
}

/** Admin: listar cartões detalhados de um usuário da empresa logada */
export const adminGetUserCardsDetailed = (userId: string) =>
  api.get<InstanceDetail[]>(`/loyalty/admin/users/${userId}/cards/detail`)

/** Admin: emitir/atribuir cartão para um usuário (já adicionamos antes, mas deixo aqui) */
export function adminIssueCardForUser(
  templateId: string,
  payload: IssueForUserPayload
) {
  return api.post<InstanceRead>(`/loyalty/admin/templates/${templateId}/issue-for-user`, payload)
}
// src/services/couponMetricsService.ts
import api from './api';
import type {
  TimeGranularity,
  CouponMetricsSummary,
  CouponTimeseriesResponse,
  CouponBubblePoint,
  CouponMapPoint,
  PaginatedCouponUsage,
} from '@/types/couponMetrics';
import { isAxiosError } from 'axios';

/**
 * Constrói querystring a partir de um objeto de params (string | number).
 */
function q(params: Record<string, string | number>): string {
  const usp = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)])
  );
  return `?${usp.toString()}`;
}

/** Type guard utilitário */
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;

/**
 * Extrai mensagem legível de um payload de erro comum do backend:
 * - { detail: string } | { message: string } | { error: string }
 * - { detail: Array<{ msg: string; ... }> } (padrão pydantic/fastapi)
 * - { detail: { msg: string } }
 */
function extractErrorText(data: unknown): string | undefined {
  if (typeof data === 'string') return data;
  if (!isRecord(data)) return undefined;

  const detail = (data as Record<string, unknown>).detail;

  if (typeof detail === 'string') return detail;

  if (Array.isArray(detail)) {
    const msgs = detail
      .map((it) =>
        isRecord(it) && typeof it.msg === 'string' ? it.msg : undefined
      )
      .filter((m): m is string => typeof m === 'string');
    if (msgs.length) return msgs.join(', ');
  } else if (isRecord(detail) && typeof detail.msg === 'string') {
    return detail.msg;
  }

  if (typeof data.message === 'string') return data.message;
  if (typeof data.error === 'string') return data.error;

  return undefined;
}

/**
 * Tratamento básico de erro p/ padronizar exceções vindas do Axios.
 * Re-lança o erro já com message mais amigável quando possível.
 */
function rethrow(err: unknown): never {
  if (isAxiosError(err)) {
    const status = err.response?.status;
    const detail = extractErrorText(err.response?.data) ?? err.message ?? 'Erro na requisição';
    const msg = status ? `[${status}] ${detail}` : detail;
    throw new Error(msg);
  }
  throw err instanceof Error ? err : new Error(String(err));
}

/**
 * Obs.: garanta que o baseURL do `api` já possua prefixo do backend, ex.: `/api/v1`.
 * Assim os paths abaixo ficam limpos.
 */

export async function fetchCouponsSummary(
  date_from: string,
  date_to: string
): Promise<CouponMetricsSummary> {
  try {
    const { data } = await api.get<CouponMetricsSummary>(
      `/coupons/metrics/summary${q({ date_from, date_to })}`
    );
    return data;
  } catch (err) {
    rethrow(err);
  }
}

export async function fetchCouponsTimeseries(
  date_from: string,
  date_to: string,
  granularity: TimeGranularity = 'day',
  coupon_id?: string
): Promise<CouponTimeseriesResponse> {
  try {
    const params: Record<string, string | number> = { date_from, date_to, granularity };
    if (coupon_id) params.coupon_id = coupon_id;

    const { data } = await api.get<CouponTimeseriesResponse>(
      `/coupons/metrics/timeseries${q(params)}`
    );
    return data;
  } catch (err) {
    rethrow(err);
  }
}

export async function fetchCouponSummaryById(
  coupon_id: string,
  date_from: string,
  date_to: string
): Promise<CouponMetricsSummary> {
  try {
    const { data } = await api.get<CouponMetricsSummary>(
      `/coupons/metrics/${coupon_id}/summary${q({ date_from, date_to })}`
    );
    return data;
  } catch (err) {
    rethrow(err);
  }
}

export async function fetchTrackingBubbles(
  date_from: string,
  date_to: string
): Promise<CouponBubblePoint[]> {
  try {
    const { data } = await api.get<CouponBubblePoint[]>(
      `/coupons/metrics/tracking/bubbles${q({ date_from, date_to })}`
    );
    return data;
  } catch (err) {
    rethrow(err);
  }
}

export async function fetchTrackingMap(
  date_from: string,
  date_to: string
): Promise<CouponMapPoint[]> {
  try {
    const { data } = await api.get<CouponMapPoint[]>(
      `/coupons/metrics/tracking/map${q({ date_from, date_to })}`
    );
    return data;
  } catch (err) {
    rethrow(err);
  }
}

export async function fetchCouponUsage(
  coupon_id: string,
  date_from: string, // YYYY-MM-DD
  date_to: string,   // YYYY-MM-DD
  skip = 0,
  limit = 10
): Promise<PaginatedCouponUsage> {
  try {
    const { data } = await api.get<PaginatedCouponUsage>(
      `/coupons/metrics/${coupon_id}/usage${q({ date_from, date_to, skip, limit })}`
    );
    return data;
  } catch (err) {
    rethrow(err);
  }
}

/* ================== Helpers para gráficos / mapas ================== */

/**
 * Converte a série temporal em arrays prontos para line/area chart.
 * Converte period_start (ISO) → Date, que costuma ser o que libs de chart esperam.
 */
export function toLineSeries(ts: CouponTimeseriesResponse): Array<{
  t: Date;
  redemptions: number;
  discount: number;
  users: number;
}> {
  return ts.points.map((p) => ({
    t: new Date(p.period_start),
    redemptions: p.redemptions,
    discount: p.total_discount,
    users: p.unique_users,
  }));
}

/** Ordena bolhas por usos (desc) e devolve para bubble chart */
export function toBubbleSeries(bubbles: CouponBubblePoint[]): Array<{
  id: string;
  label: string;
  value: number;
  code: string;
  name: string;
  order: number;
}> {
  return [...bubbles]
    .sort((a, b) => b.uses - a.uses)
    .map((b) => ({
      id: b.coupon_id,
      label: b.label ?? b.name,
      value: b.uses,
      code: b.code,
      name: b.name,
      order: b.order,
    }));
}

/** Converte pontos de mapa para um formato uniforme de marker */
export function toMapMarkers(points: CouponMapPoint[]): Array<{
  id: string;
  label: string;
  uses: number;
  position: { lat: number; lng: number };
  code: string;
  name: string;
}> {
  return points
    .filter((p) => p.lat != null && p.lng != null)
    .map((p) => ({
      id: p.coupon_id,
      label: p.label ?? p.name,
      uses: p.uses,
      position: { lat: p.lat as number, lng: p.lng as number },
      code: p.code,
      name: p.name,
    }));
}

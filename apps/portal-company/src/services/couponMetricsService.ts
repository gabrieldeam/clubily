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

/** Querystring helper */
function q(params: Record<string, string | number>): string {
  const usp = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)])
  );
  return `?${usp.toString()}`;
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;

const getStringProp = (obj: unknown, key: string): string | undefined => {
  if (!isRecord(obj)) return undefined;
  const val = (obj as Record<string, unknown>)[key];
  return typeof val === 'string' ? val : undefined;
};

function extractErrorText(data: unknown): string | undefined {
  if (typeof data === 'string') return data;
  if (!isRecord(data)) return undefined;

  const detail = (data as Record<string, unknown>).detail;

  // detail pode ser string
  if (typeof detail === 'string') return detail;

  // ...ou array de objetos
  if (Array.isArray(detail)) {
    const msgs = detail
      .map(
        (it) =>
          getStringProp(it, 'msg') ??
          getStringProp(it, 'message') ??
          getStringProp(it, 'error')
      )
      .filter((m): m is string => typeof m === 'string');
    if (msgs.length) return msgs.join(', ');
  }

  // ...ou objeto com msg/message/error
  if (isRecord(detail)) {
    const m =
      getStringProp(detail, 'msg') ??
      getStringProp(detail, 'message') ??
      getStringProp(detail, 'error');
    if (m) return m;
  }

  // Fallback em nível raiz
  return (
    getStringProp(data, 'message') ??
    getStringProp(data, 'error') ??
    undefined
  );
}

function rethrow(err: unknown): never {
  if (isAxiosError(err)) {
    const status = err.response?.status;
    const detail =
      extractErrorText(err.response?.data) ??
      err.message ??
      'Erro na requisição';
    const msg = status ? `[${status}] ${detail}` : detail;
    throw new Error(msg);
  }
  throw err instanceof Error ? err : new Error(String(err));
}


/* ================== Calls ================== */

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

/* ================== Helpers ================== */

/** Timeseries → chart-friendly */
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

/**
 * BUBBLES (compatível): mantém somente o essencial (id/label/value…)
 * — não inclui discount para não quebrar usos existentes.
 */
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

/** Versão “rica” com desconto total — use quando quiser exibir R$ no UI */
export function toBubbleSeriesRich(bubbles: CouponBubblePoint[]): Array<{
  id: string;
  label: string;
  value: number;
  discount: number;
  code: string;
  name: string;
  order: number;
}> {
  const sorted = [...bubbles].sort((a, b) => b.uses - a.uses);
  return sorted.map((b) => ({
    id: b.coupon_id,
    label: b.label ?? b.name,
    value: b.uses,
    discount: b.total_discount,
    code: b.code,
    name: b.name,
    order: sorted.findIndex(x => x.coupon_id === b.coupon_id) + 1,
  }));
}

/** MAP (compatível): mantém assinatura anterior */
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

/** Versão “rica” do MAP com desconto total para popups/tooltips */
export function toMapMarkersRich(points: CouponMapPoint[]): Array<{
  id: string;
  label: string;
  uses: number;
  discount: number;
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
      discount: p.total_discount,
      position: { lat: p.lat as number, lng: p.lng as number },
      code: p.code,
      name: p.name,
    }));
}

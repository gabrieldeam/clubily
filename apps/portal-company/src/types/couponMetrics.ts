export type TimeGranularity = 'day' | 'week' | 'month';

export interface CouponMetricsSummary {
  total_redemptions: number;
  total_discount: number;
  unique_users: number;
  avg_uses_per_user: number;
}

export interface CouponTimeseriesPoint {
  period_start: string; // ISO datetime (ex.: "2025-08-12T00:00:00Z")
  redemptions: number;
  total_discount: number;
  unique_users: number;
}

export interface CouponTimeseriesResponse {
  granularity: TimeGranularity;
  points: CouponTimeseriesPoint[];
}

export interface CouponBubblePoint {
  coupon_id: string;
  code: string;
  name: string;
  label?: string | null;
  uses: number;
  order: number;
}

export interface CouponMapPoint {
  coupon_id: string;
  code: string;
  name: string;
  label?: string | null;
  uses: number;
  lat?: number | null;
  lng?: number | null;
}

export interface CouponUsageItem {
  id: string;
  coupon_id: string;
  user_id: string;
  user_name?: string | null;
  amount: number;
  discount_applied: number;
  source_location_name?: string | null;
  lat?: number | null;
  lng?: number | null;
  created_at: string; // ISO
}

export interface PaginatedCouponUsage {
  total: number;
  skip: number;
  limit: number;
  items: CouponUsageItem[];
}

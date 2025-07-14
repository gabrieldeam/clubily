// src/types/LoyaltyMetrics.ts

export interface MetricSummary {
  template_id: string | null;
  total_cards: number;
  unique_users: number;
  total_stamps: number;
  rewards_redeemed: number;
}

export interface SeriesPoint {
  day: string;    // “YYYY-MM-DD”
  value: number;
}

export interface ChartSeries {
  name: string;
  points: SeriesPoint[];
}

export interface MetricsCharts {
  template_id: string | null;
  series: ChartSeries[];
}

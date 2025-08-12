'use client';

import { useMemo } from 'react';
import {
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { CouponTimeseriesResponse, TimeGranularity } from '@/types/couponMetrics';
import styles from './CouponsCharts.module.css';

type Props = {
  timeseries: CouponTimeseriesResponse | null | undefined;
  granularity: TimeGranularity;
  loading?: boolean;
};

type ChartDatum = { label: string; value: number };
type Series = {
  redemptions: ChartDatum[];
  discount: ChartDatum[];
  users: ChartDatum[];
};

function fmtLabel(d: Date, granularity: TimeGranularity) {
  if (granularity === 'day')   return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  if (granularity === 'week')  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  // month
  return d.toLocaleDateString('pt-BR', { month: '2-digit', year: '2-digit' });
}

function toSeries(ts: CouponTimeseriesResponse | null | undefined, granularity: TimeGranularity): Series {
  if (!ts?.points?.length) return { redemptions: [], discount: [], users: [] };

  const redemptions: ChartDatum[] = ts.points.map(p => ({
    label: fmtLabel(new Date(p.period_start), granularity),
    value: p.redemptions,
  }));
  const discount: ChartDatum[] = ts.points.map(p => ({
    label: fmtLabel(new Date(p.period_start), granularity),
    value: p.total_discount,
  }));
  const users: ChartDatum[] = ts.points.map(p => ({
    label: fmtLabel(new Date(p.period_start), granularity),
    value: p.unique_users,
  }));
  return { redemptions, discount, users };
}

function currencyBR(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function CouponsCharts({ timeseries, granularity, loading }: Props) {
  const { redemptions, discount, users } = useMemo(
    () => toSeries(timeseries, granularity),
    [timeseries, granularity]
  );

  if (loading) return <p className={styles.message}>Carregando gráficos…</p>;
  if (!timeseries) return null;

  const hasAny =
    (redemptions?.length ?? 0) + (discount?.length ?? 0) + (users?.length ?? 0) > 0;
  if (!hasAny) return <p className={styles.message}>Sem dados para o período.</p>;

  return (
    <div className={styles.container}>
      <div className={styles.grid}>

        {/* Usos por período */}
        <div className={styles.chartBox}>
          <h5>Usos por {granularity === 'day' ? 'dia' : granularity === 'week' ? 'semana' : 'mês'}</h5>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={redemptions} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-uses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4e79a7" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#4e79a7" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--clr-border)" />
              <XAxis dataKey="label" tick={{ fill: 'var(--clr-text-light)', fontSize: 12 }} tickLine={false} />
              <YAxis tick={{ fill: 'var(--clr-text-light)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, borderColor: '#ccc' }} />
              <Legend verticalAlign="top" align="right" iconType="circle" />
              <Bar dataKey="value" name="Usos" fill="url(#grad-uses)" animationDuration={700} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Desconto concedido */}
        <div className={styles.chartBox}>
          <h5>Desconto concedido</h5>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={discount} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--clr-border)" />
              <XAxis dataKey="label" tick={{ fill: 'var(--clr-text-light)', fontSize: 12 }} tickLine={false} />
              <YAxis tick={{ fill: 'var(--clr-text-light)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                // evitar 'any': aceitar desconhecido e normalizar para número
                formatter={(v: unknown) => currencyBR(typeof v === 'number' ? v : Number(v))}
                contentStyle={{ borderRadius: 8, borderColor: '#ccc' }}
              />
              <Legend verticalAlign="top" align="right" iconType="circle" />
              <Line type="monotone" dataKey="value" name="Desconto (R$)" stroke="#f28e2b" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Usuários únicos */}
        <div className={styles.chartBox}>
          <h5>Usuários únicos</h5>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={users} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--clr-border)" />
              <XAxis dataKey="label" tick={{ fill: 'var(--clr-text-light)', fontSize: 12 }} tickLine={false} />
              <YAxis tick={{ fill: 'var(--clr-text-light)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, borderColor: '#ccc' }} />
              <Legend verticalAlign="top" align="right" iconType="circle" />
              <Line type="monotone" dataKey="value" name="Usuários" stroke="#76b7b2" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}

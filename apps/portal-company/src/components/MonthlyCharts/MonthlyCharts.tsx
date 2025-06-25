'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getMonthlyCharts } from '@/services/cashbackMetricsService';
import type { MonthlyCharts as MC, DataPoint } from '@/types/cashbackMetrics';
import styles from './MonthlyCharts.module.css';

interface MonthlyChartsProps {
  startDate?: Date | null;
  endDate?: Date | null;
}

export default function MonthlyCharts({ startDate, endDate }: MonthlyChartsProps) {
  const [data, setData] = useState<MC | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sd = startDate ? startDate.toISOString().slice(0, 10) : undefined;
    const ed = endDate ? endDate.toISOString().slice(0, 10) : undefined;
    setLoading(true);
    setError(null);

    getMonthlyCharts(sd, ed)
      .then((res) => setData(res.data))
      .catch(() => setError('Não foi possível carregar os gráficos.'))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  if (loading) return <p className={styles.message}>Carregando gráficos…</p>;
  if (error) return <p className={styles.messageError}>{error}</p>;
  if (!data) return null;

  const fmt = (arr: DataPoint[]) =>
    arr.map((p) => ({ day: p.day.toString().slice(-2), value: p.value }));

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Indicadores Diários</h3>
      <div className={styles.grid}>
        {/* Gastos por Dia */}
        <div className={styles.chartBox}>
          <h5>Gastos por Dia</h5>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={fmt(data.spend_by_day)}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="grad-spend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4e79a7" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#4e79a7" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--clr-border)" />
              <XAxis
                dataKey="day"
                tick={{ fill: 'var(--clr-text-light)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--clr-border)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--clr-text-light)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v) =>
                  (v as number).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })
                }
                contentStyle={{ borderRadius: 8, borderColor: '#ccc' }}
              />
              <Legend verticalAlign="top" align="right" iconType="circle" />
              <Bar
                dataKey="value"
                name="Gasto (R$)"
                fill="url(#grad-spend)"
                animationDuration={800}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cashback Gerado */}
        <div className={styles.chartBox}>
          <h5>Cashback Gerado</h5>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={fmt(data.cashback_value_by_day)}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="grad-cashback" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f28e2b" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#f28e2b" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--clr-border)" />
              <XAxis
                dataKey="day"
                tick={{ fill: 'var(--clr-text-light)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--clr-border)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--clr-text-light)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v) =>
                  (v as number).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })
                }
                contentStyle={{ borderRadius: 8, borderColor: '#ccc' }}
              />
              <Legend verticalAlign="top" align="right" iconType="circle" />
              <Line
                type="monotone"
                dataKey="value"
                name="Cashback (R$)"
                stroke="#f28e2b"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
                animationDuration={800}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Contagem de Cashbacks */}
        <div className={styles.chartBox}>
          <h5>Contagem de Cashbacks</h5>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={fmt(data.cashback_count_by_day)}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="grad-count" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e15759" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#e15759" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--clr-border)" />
              <XAxis
                dataKey="day"
                tick={{ fill: 'var(--clr-text-light)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--clr-border)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--clr-text-light)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={{ borderRadius: 8, borderColor: '#ccc' }} />
              <Legend verticalAlign="top" align="right" iconType="circle" />
              <Bar
                dataKey="value"
                name="Qtde"
                fill="url(#grad-count)"
                animationDuration={800}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Novos Usuários */}
        <div className={styles.chartBox}>
          <h5>Novos Usuários</h5>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={fmt(data.new_users_by_day)}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="grad-users" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#76b7b2" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#76b7b2" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--clr-border)" />
              <XAxis
                dataKey="day"
                tick={{ fill: 'var(--clr-text-light)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--clr-border)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--clr-text-light)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={{ borderRadius: 8, borderColor: '#ccc' }} />
              <Legend verticalAlign="top" align="right" iconType="circle" />
              <Line
                type="monotone"
                dataKey="value"
                name="Novos"
                stroke="#76b7b2"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
                animationDuration={800}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

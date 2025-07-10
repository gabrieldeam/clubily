// src/components/MetricsPurchase/MetricsPurchase.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  getPurchaseMetrics,
  getPurchaseChart,
} from '@/services/purchaseMetricsService';
import type { PurchaseMetricRead, SaleByDay } from '@/types/purchaseMetrics';
import CalendarRange from '@/components/CalendarRange/CalendarRange';
import Modal from '@/components/Modal/Modal';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import styles from './MetricsPurchase.module.css';

type Preset = {
  label: string;
  compute: () => { start: Date; end: Date };
};

export default function MetricsPurchase() {
  const today = new Date();
  const [startDate, setStartDate] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [endDate, setEndDate] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth() + 1, 0)
  );

  const [overview, setOverview] = useState<PurchaseMetricRead | null>(null);
  const [dailyData, setDailyData] = useState<SaleByDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);

  const presets: Preset[] = [
    { label: '1 dia', compute: () => ({ start: new Date(), end: new Date() }) },
    {
      label: '7 dias',
      compute: () => ({
        start: new Date(Date.now() - 6 * 86400000),
        end: new Date(),
      }),
    },
    {
      label: '30 dias',
      compute: () => ({
        start: new Date(Date.now() - 29 * 86400000),
        end: new Date(),
      }),
    },
    {
      label: '6 meses',
      compute: () => {
        const d = new Date();
        d.setMonth(d.getMonth() - 6);
        d.setDate(d.getDate() + 1);
        return { start: d, end: new Date() };
      },
    },
    {
      label: '12 meses',
      compute: () => {
        const d = new Date();
        d.setMonth(d.getMonth() - 12);
        d.setDate(d.getDate() + 1);
        return { start: d, end: new Date() };
      },
    },
  ];

  useEffect(() => {
    const sd = startDate.toISOString().slice(0, 10);
    const ed = endDate.toISOString().slice(0, 10);
    setLoading(true);
    setError(null);

    Promise.all([
      getPurchaseMetrics(sd, ed),
      getPurchaseChart(sd, ed),
    ])
      .then(([ov, daily]) => {
        setOverview(ov.data);
        setDailyData(daily.data);
      })
      .catch(() => setError('Falha ao carregar métricas de compras.'))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  const RangeButton = ({ onClick }: { onClick: () => void }) => (
    <button className={styles.rangeBtn} onClick={onClick}>
      {startDate.toLocaleDateString()} – {endDate.toLocaleDateString()}
    </button>
  );

  const CalendarModal = ({
    open,
    onClose,
  }: {
    open: boolean;
    onClose: () => void;
  }) => (
    <Modal open={open} onClose={onClose} width={520}>
      <div className={styles.calendarDropdown}>
        <CalendarRange
          selectedStartDate={startDate}
          selectedEndDate={endDate}
          onRangeChange={(s, e) => {
            if (!e) {
              setStartDate(s);
              setEndDate(s);
            } else {
              setEndDate(e);
            }
            if (e) onClose();
          }}
        />
        <div className={styles.presetsWrapper}>
          {presets.map((p) => {
            const { start, end } = p.compute();
            const isActive =
              start.toDateString() === startDate.toDateString() &&
              end.toDateString() === endDate.toDateString();
            return (
              <button
                key={p.label}
                className={`${styles.presetBtn} ${
                  isActive ? styles.activePresetBtn : ''
                }`}
                onClick={() => {
                  setStartDate(start);
                  setEndDate(end);
                  onClose();
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );

  if (loading) return <p className={styles.message}>Carregando métricas…</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <>
      {overview && (
        <div className={styles.card}>
          <header className={styles.cardHeader}>
            <h3 className={styles.title}>Métricas de Compras</h3>
            <RangeButton onClick={() => setOpenModal(true)} />
          </header>

          <div className={styles.metricGrid}>
            <div className={styles.metricCard}>
              <h4>Total de compras</h4>
              <p>{overview.total_purchases}</p>
            </div>
            <div className={styles.metricCard}>
              <h4>Faturamento total</h4>
              <p>R$ {overview.total_sales.toFixed(2)}</p>
            </div>
            <div className={styles.metricCard}>
              <h4>Média por compra</h4>
              <p>R$ {overview.avg_ticket.toFixed(2)}</p>
            </div>
            <div className={styles.metricCard}>
              <h4>Compradores únicos</h4>
              <p>{overview.unique_buyers}</p>
            </div>
            <div className={styles.metricCard}>
              <h4>Média compras/usuário</h4>
              <p>{overview.avg_purchases_per_user.toFixed(2)}</p>
            </div>
          </div>

          <div className={styles.chartsGrid}>
            <div className={styles.chartBox}>
              <h5>Compras & Receita por Dia</h5>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart
                  data={dailyData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="grad-count" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4e79a7" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#4e79a7" stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="grad-rev" x1="0" y1="0" x2="0" y2="1">
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
                    yAxisId="left"
                    tick={{ fill: 'var(--clr-text-light)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: 'var(--clr-text-light)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(v, name) =>
                      name === 'Receita'
                        ? (v as number).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })
                        : v
                    }
                    contentStyle={{ borderRadius: 8, borderColor: '#ccc' }}
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="num_purchases"
                    name="Compras"
                    stroke="url(#grad-count)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    name="Receita"
                    stroke="url(#grad-rev)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <CalendarModal open={openModal} onClose={() => setOpenModal(false)} />
        </div>
      )}
    </>
  );
}

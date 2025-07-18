// src/components/MetricsLoyalty/MetricsLoyalty.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  getMetricSummary,
  getMetricsCharts,
} from '@/services/loyaltyMetricsService';
import type {
  MetricSummary,
  ChartSeries,
} from '@/types/LoyaltyMetrics';
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
} from 'recharts';

import styles from './MetricsLoyalty.module.css';

/** Presets iguais ao exemplo de pontos */
const presets = [
  { label: '1 dia', compute: () => ({ start: new Date(), end: new Date() }) },
  {
    label: '7 dias',
    compute: () => ({
      start: new Date(Date.now() - 6 * 86_400_000),
      end: new Date(),
    }),
  },
  {
    label: '30 dias',
    compute: () => ({
      start: new Date(Date.now() - 29 * 86_400_000),
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
] as const;

export default function MetricsLoyalty() {
  const today = new Date();
  const [startDate, setStartDate] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [endDate, setEndDate] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth() + 1, 0),
  );

  // dados
  const [summary, setSummary] = useState<MetricSummary | null>(null);
  const [series, setSeries]   = useState<ChartSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // modal calendário
  const [openModal, setOpenModal] = useState(false);

  // ----------------------------------------------------------------------------
  // fetch
  // ----------------------------------------------------------------------------
  useEffect(() => {
    const sd = startDate.toISOString().slice(0, 10);
    const ed = endDate  .toISOString().slice(0, 10);

    setLoading(true);
    setError(null);

    Promise.all([
      getMetricSummary(undefined, sd, ed),
      getMetricsCharts(undefined, sd, ed),
    ])
      .then(([sumRes, chartsRes]) => {
        setSummary(sumRes.data);
        setSeries(chartsRes.data.series);
      })
      .catch(() => setError('Falha ao carregar métricas de fidelidade.'))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  // ----------------------------------------------------------------------------
  // helpers
  // ----------------------------------------------------------------------------
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

  // ----------------------------------------------------------------------------
  // render
  // ----------------------------------------------------------------------------
  if (loading) return <p className={styles.message}>Carregando métricas…</p>;
  if (error)   return <p className={styles.error}>{error}</p>;

  return (
    <>
      {summary && (
        <div className={styles.card}>
          <header className={styles.cardHeader}>
            <h3 className={styles.title}>Visão Geral do Cartão Fidelidade</h3>
            <RangeButton onClick={() => setOpenModal(true)} />
          </header>

          <div className={styles.metricGrid}>
            <div className={styles.metricCard}>
              <h4>Cartões emitidos</h4>
              <p>{summary.total_cards}</p>
            </div>
            <div className={styles.metricCard}>
              <h4>Usuários únicos</h4>
              <p>{summary.unique_users}</p>
            </div>
            <div className={styles.metricCard}>
              <h4>Carimbos dados</h4>
              <p>{summary.total_stamps}</p>
            </div>
            <div className={styles.metricCard}>
              <h4>Recompensas resgatadas</h4>
              <p>{summary.rewards_redeemed}</p>
            </div>
          </div>

          {/* ----- Gráficos  (um para cada série retornada) ----- */}
          <div className={styles.chartsGrid}>
            {series.map((s) => (
              <div key={s.name} className={styles.chartBox}>
                <h5>{s.name}</h5>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart
                    data={s.points}
                    margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--clr-border)"
                    />
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
                      contentStyle={{
                        borderRadius: 8,
                        borderColor: '#ccc',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 6 }}
                      stroke="#4e79a7"
                      animationDuration={800}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>

          <CalendarModal open={openModal} onClose={() => setOpenModal(false)} />
        </div>
      )}
    </>
  );
}

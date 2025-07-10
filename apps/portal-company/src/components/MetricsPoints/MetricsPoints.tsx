// src/components/MetricsPoints/MetricsPoints.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  getPointsOverview,
  getPointsAwardedChart,
  getTxVsUsersChart,
  getAvgPointsPerTxChart,
} from '@/services/pointsMetricsService';
import type {
  PointsMetricRead,
  PointsByDay,
  TxUserStatsByDay,
  AvgPointsPerTxByDay,
} from '@/types/pointsMetrics';
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
import styles from './MetricsPoints.module.css';

type Preset = {
  label: string;
  compute: () => { start: Date; end: Date };
};

export default function MetricsPoints() {
  const today = new Date();
  const [startDate, setStartDate] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [endDate, setEndDate] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth() + 1, 0)
  );

  const [overview, setOverview] = useState<PointsMetricRead | null>(null);
  const [awardedData, setAwardedData] = useState<PointsByDay[]>([]);
  const [txUsersData, setTxUsersData] = useState<TxUserStatsByDay[]>([]);
  const [avgPerTxData, setAvgPerTxData] = useState<AvgPointsPerTxByDay[]>([]);
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
      getPointsOverview(sd, ed),
      getPointsAwardedChart(sd, ed),
      getTxVsUsersChart(sd, ed),
      getAvgPointsPerTxChart(sd, ed),
    ])
      .then(([ov, awarded, txUsers, avgTx]) => {
        setOverview(ov.data);
        setAwardedData(awarded.data);
        setTxUsersData(txUsers.data);
        setAvgPerTxData(avgTx.data);
      })
      .catch(() => setError('Falha ao carregar métricas de pontos.'))
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
            <h3 className={styles.title}>Visão Geral de Pontos</h3>
            <RangeButton onClick={() => setOpenModal(true)} />
          </header>

          <div className={styles.metricGrid}>
            <div className={styles.metricCard}>
              <h4>Total premiado</h4>
              <p>{overview.total_awarded}</p>
            </div>
            <div className={styles.metricCard}>
              <h4>Nº de transações</h4>
              <p>{overview.transaction_count}</p>
            </div>
            <div className={styles.metricCard}>
              <h4>Usuários únicos</h4>
              <p>{overview.unique_users}</p>
            </div>
            <div className={styles.metricCard}>
              <h4>Média por transação</h4>
              <p>{overview.average_per_tx.toFixed(2)}</p>
            </div>
          </div>

          <div className={styles.chartsGrid}>
            <div className={styles.chartBox}>
              <h5>Pontos por Dia</h5>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart
                  data={awardedData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="grad-awarded"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#4e79a7"
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="100%"
                        stopColor="#4e79a7"
                        stopOpacity={0.2}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--clr-border)"
                  />
                  <XAxis
                    dataKey="day"
                    tick={{
                      fill: 'var(--clr-text-light)',
                      fontSize: 12,
                    }}
                    axisLine={{ stroke: 'var(--clr-border)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{
                      fill: 'var(--clr-text-light)',
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      borderColor: '#ccc',
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                  />
                  <Line
                    type="monotone"
                    dataKey="points_awarded"
                    name="Premiados"
                    stroke="url(#grad-awarded)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                    animationDuration={800}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className={styles.chartBox}>
              <h5>Transações vs Usuários</h5>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart
                  data={txUsersData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--clr-border)"
                  />
                  <XAxis
                    dataKey="day"
                    tick={{
                      fill: 'var(--clr-text-light)',
                      fontSize: 12,
                    }}
                    axisLine={{ stroke: 'var(--clr-border)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{
                      fill: 'var(--clr-text-light)',
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      borderColor: '#ccc',
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                  />
                  <Line
                    type="monotone"
                    dataKey="tx_count"
                    name="Transações"
                    stroke="#4e79a7"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="unique_users"
                    name="Usuários"
                    stroke="#f28e2b"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className={styles.chartBox}>
              <h5>Média por Transação</h5>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart
                  data={avgPerTxData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="grad-avg"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#59a14f"
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="100%"
                        stopColor="#59a14f"
                        stopOpacity={0.2}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--clr-border)"
                  />
                  <XAxis
                    dataKey="day"
                    tick={{
                      fill: 'var(--clr-text-light)',
                      fontSize: 12,
                    }}
                    axisLine={{ stroke: 'var(--clr-border)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{
                      fill: 'var(--clr-text-light)',
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      borderColor: '#ccc',
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                  />
                  <Line
                    type="monotone"
                    dataKey="avg_points"
                    name="Média"
                    stroke="url(#grad-avg)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                    animationDuration={800}
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

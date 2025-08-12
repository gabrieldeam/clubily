'use client';

import { useEffect, useMemo, useState } from 'react';
import CalendarRange from '@/components/CalendarRange/CalendarRange';
import Modal from '@/components/Modal/Modal';
import { fetchCouponsSummary, fetchCouponsTimeseries } from '@/services/couponMetricsService';
import type { CouponMetricsSummary, CouponTimeseriesResponse, TimeGranularity } from '@/types/couponMetrics';
import CouponsCharts from './Charts/CouponsCharts';
import styles from './CouponsOverview.module.css';

type Preset = {
  label: string;
  compute: () => { start: Date; end: Date };
};

function iso(d: Date) {
  // YYYY-MM-DD
  return d.toISOString().slice(0, 10);
}
function fmtBRL(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function CouponsOverview() {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth  = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const [startDate, setStartDate] = useState<Date>(firstDayOfMonth);
  const [endDate, setEndDate]     = useState<Date>(lastDayOfMonth);
  const [granularity] = useState<TimeGranularity>('day');

  const [summary, setSummary] = useState<CouponMetricsSummary | null>(null);
  const [series, setSeries]   = useState<CouponTimeseriesResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingSeries, setLoadingSeries] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);

  const presets: Preset[] = [
    { label: 'Hoje', compute: () => ({ start: new Date(), end: new Date() }) },
    { label: '7 dias', compute: () => {
        const end = new Date(); const start = new Date(); start.setDate(end.getDate() - 6);
        return { start, end };
      }
    },
    { label: '30 dias', compute: () => {
        const end = new Date(); const start = new Date(); start.setDate(end.getDate() - 29);
        return { start, end };
      }
    },
    { label: 'Este mês', compute: () => {
        const d = new Date(); return {
          start: new Date(d.getFullYear(), d.getMonth(), 1),
          end: new Date(d.getFullYear(), d.getMonth() + 1, 0)
        };
      }
    },
    { label: 'YTD', compute: () => {
        const end = new Date(); const start = new Date(end.getFullYear(), 0, 1);
        return { start, end };
      }
    },
  ];

  // Carrega SUMÁRIO
  useEffect(() => {
    const df = iso(startDate), dt = iso(endDate);
    setLoading(true); setError(null);
    fetchCouponsSummary(df, dt)
      .then(setSummary)
      .catch(() => setError('Não foi possível carregar o resumo de cupons.'))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  // Carrega SÉRIE
  useEffect(() => {
    const df = iso(startDate), dt = iso(endDate);
    setLoadingSeries(true); setError(null);
    fetchCouponsTimeseries(df, dt, granularity)
      .then(setSeries)
      .catch(() => setError('Não foi possível carregar a série temporal.'))
      .finally(() => setLoadingSeries(false));
  }, [startDate, endDate, granularity]);

  const cards = useMemo(() => {
    const s = summary;
    const totalDiscount = s?.total_discount ?? 0;
    const totalUses     = s?.total_redemptions ?? 0;
    const avgUsesUser   = s?.avg_uses_per_user ?? 0;
    const uniqUsers     = s?.unique_users ?? 0;
    const avgDiscountPerUse = totalUses > 0 ? totalDiscount / totalUses : 0;

    return [
      { title: 'Desconto Total', value: fmtBRL(totalDiscount) },
      { title: 'Total de Usos',  value: totalUses.toLocaleString('pt-BR') },
      { title: 'Usuários Únicos', value: uniqUsers.toLocaleString('pt-BR') },
      { title: 'Média por Usuário', value: avgUsesUser.toFixed(2) },
      { title: 'Desconto Médio por Uso', value: fmtBRL(avgDiscountPerUse) },
    ];
  }, [summary]);

  return (
    <section className={styles.main}>
      <div className={styles.sectionHeader}>
        <h3>Visão Geral de Cupons</h3>

        <div className={styles.controls}>
          

          {/* Período */}
          <button className={styles.rangeBtn} onClick={() => setOpenModal(true)}>
            {startDate.toLocaleDateString()} – {endDate.toLocaleDateString()}
          </button>
        </div>
      </div>

      {/* Modal de período com presets */}
      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <div className={styles.calendarDropdown}>
          <CalendarRange
            selectedStartDate={startDate}
            selectedEndDate={endDate}
            onRangeChange={(s, e) => {
              if (!e) {
                setStartDate(s);
                setEndDate(s);
              } else {
                setStartDate(s);
                setEndDate(e);
              }
            }}
          />

          <div className={styles.presetsWrapper}>
            {presets.map(p => {
              const { start, end } = p.compute();
              const isActive =
                startDate.toDateString() === start.toDateString() &&
                endDate.toDateString() === end.toDateString();
              return (
                <button
                  key={p.label}
                  className={`${styles.presetBtn} ${isActive ? styles.activePresetBtn : ''}`}
                  onClick={() => {
                    setStartDate(start);
                    setEndDate(end);
                    setOpenModal(false);
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* Estados */}
      {error && <p className={styles.error}>{error}</p>}

      {/* Cards */}
      {!error && (
        <div className={styles.cardsGrid}>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div className={`${styles.card} ${styles.skeleton}`} key={i} />
              ))
            : cards.map(c => (
                <div className={styles.card} key={c.title}>
                  <h4>{c.title}</h4>
                  <p>{c.value}</p>
                </div>
              ))
          }
        </div>
      )}

      {/* Gráficos */}
      <CouponsCharts timeseries={series} granularity={granularity} loading={loadingSeries} />
    </section>
  );
}

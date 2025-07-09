// src/components/Dashboard/Dashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header/Header';
import { getCompanyMetrics } from '@/services/cashbackMetricsService';
import type { CompanyMetrics } from '@/types/cashbackMetrics';
import CalendarRange from '@/components/CalendarRange/CalendarRange';
import MetricsPoints from '@/components/MetricsPoints/MetricsPoints';
import MetricsPurchase from '@/components/MetricsPurchase/MetricsPurchase';
import Metrics from '../MonthlyCharts/MonthlyCharts';
import Modal from '@/components/Modal/Modal';
import styles from './Dashboard.module.css';

type Preset = {
  label: string;
  compute: () => { start: Date; end: Date };
};

export default function Dashboard() {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth  = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const [startDate, setStartDate] = useState<Date | null>(firstDayOfMonth);
  const [endDate,   setEndDate]   = useState<Date | null>(lastDayOfMonth);
  const [metrics, setMetrics] = useState<CompanyMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);

  const presets: Preset[] = [
    { label: '1 dia',   compute: () => ({ start: new Date(), end: new Date() }) },
    { label: '2 dias',  compute: () => ({ start: new Date(Date.now() - 1 * 24 * 3600 * 1000), end: new Date() }) },
    { label: '5 dias',  compute: () => ({ start: new Date(Date.now() - 4 * 24 * 3600 * 1000), end: new Date() }) },
    { label: '10 dias', compute: () => ({ start: new Date(Date.now() - 9 * 24 * 3600 * 1000), end: new Date() }) },
    { label: '15 dias', compute: () => ({ start: new Date(Date.now() - 14 * 24 * 3600 * 1000), end: new Date() }) },
    { label: '30 dias', compute: () => ({ start: new Date(Date.now() - 29 * 24 * 3600 * 1000), end: new Date() }) },
    { label: '6 meses', compute: () => {
        const d = new Date();
        d.setMonth(d.getMonth() - 6);
        // ajustar para cobrir 6 meses inteiros até hoje
        d.setDate(d.getDate() + 1);
        return { start: d, end: new Date() };
      }
    },
    { label: '12 meses', compute: () => {
        const d = new Date();
        d.setMonth(d.getMonth() - 12);
        d.setDate(d.getDate() + 1);
        return { start: d, end: new Date() };
      }
    },
  ];

  useEffect(() => {
    if (!startDate || !endDate) return;
    setLoading(true);
    setError(null);
    const sd = startDate.toISOString().slice(0, 10);
    const ed = endDate.toISOString().slice(0, 10);
    getCompanyMetrics(sd, ed)
      .then(res => setMetrics(res.data))
      .catch(() => setError('Não foi possível carregar métricas consolidadas.'))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  return (
    <>
      <Header />
      <div className={styles.container}>
        <main className={styles.main}>
          <section className={styles.overviewSection}>
            <div className={styles.sectionHeader}>
              <h3>Visão Geral de Cashback</h3>
              <div className={styles.rangeWrapper}>
                <button
                  className={styles.rangeBtn}
                  onClick={() => setOpenModal(true)}
                >
                  {startDate?.toLocaleDateString()} – {endDate?.toLocaleDateString()}
                </button>              
              </div>
            </div>

                <Modal open={openModal} onClose={() => setOpenModal(false)}>
                  <div className={styles.calendarDropdown}>
                    <CalendarRange
                      selectedStartDate={startDate}
                      selectedEndDate={endDate}
                      onRangeChange={(s, e) => {
                        // Se for a primeira seleção, usa mesma data para start e end
                        if (!e) {
                          setStartDate(s);
                          setEndDate(s);
                        } else {
                          // segunda seleção: atualiza apenas endDate
                          setEndDate(e);
                        }
                        // fecha modal apenas após ter um endDate distinto
                        if (e) {
                          setOpenModal(false);
                        }
                      }}
                    />

                    <div className={styles.presetsWrapper}>
                      {presets.map(p => {
                        const { start, end } = p.compute();
                        const isActive = startDate && endDate &&
                          startDate.toDateString() === start.toDateString() &&
                          endDate.toDateString() === end.toDateString();
                        return (
                          <button
                            key={p.label}
                            className={
                              `${styles.presetBtn} ${isActive ? styles.activePresetBtn : ''}`
                            }
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

            {loading && <p>Carregando métricas...</p>}
            {error && <p className={styles.error}>{error}</p>}

            {!loading && !error && metrics && (
              <div className={styles.cardsGrid}>
                <div className={styles.card}>
                  <h4>Total de Cashback</h4>
                  <p>R$ {metrics.total_cashback_value.toFixed(2)}</p>
                </div>
                <div className={styles.card}>
                  <h4>Total Gasto</h4>
                  <p>R$ {metrics.total_amount_spent.toFixed(2)}</p>
                </div>
                <div className={styles.card}>
                  <h4>Total de Uso</h4>
                  <p>{metrics.usage_count}</p>
                </div>
                <div className={styles.card}>
                  <h4>Usuários Diferentes</h4>
                  <p>{metrics.unique_user_count}</p>
                </div>
                <div className={styles.card}>
                  <h4>Média Gasto por Uso</h4>
                  <p>R$ {metrics.average_amount_spent_per_use.toFixed(2)}</p>
                </div>
                <div className={styles.card}>
                  <h4>Média de Usos por Usuário</h4>
                  <p>{metrics.average_uses_per_user.toFixed(2)}</p>
                </div>
              </div>
            )}
          </section>

          {/* passa o mesmo período para os gráficos */}
          <Metrics startDate={startDate} endDate={endDate} />
        </main>
        
      <MetricsPoints />
      <MetricsPurchase />
      </div>
      
    </>
  );
}

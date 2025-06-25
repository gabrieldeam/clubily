// src/components/Dashboard/Dashboard.tsx
'use client';

import { useEffect, useState } from 'react'
import Header from '@/components/Header/Header'
import { getCompanyMetrics } from '@/services/cashbackMetricsService'
import type { CompanyMetrics } from '@/types/cashbackMetrics'
import Metrics from '../MonthlyCharts/MonthlyCharts'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const [metrics, setMetrics] = useState<CompanyMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getCompanyMetrics()
      .then(res => setMetrics(res.data))
      .catch(() => setError('Não foi possível carregar métricas consolidadas.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Header />
      <div className={styles.container}>
        <main className={styles.main}>
          <section className={styles.overviewSection}>
            <h3>Visão Geral de Cashback</h3>

            {loading && <p>Carregando métricas...</p>}
            {error && <p className={styles.error}>{error}</p>}

            {!loading && !error && metrics && (
              <div className={styles.cardsGrid}>
                <div className={styles.card}>
                  <h3>Total de Cashback</h3>
                  <p>R$ {metrics.total_cashback_value.toFixed(2)}</p>
                </div>
                <div className={styles.card}>
                  <h3>Total Gasto</h3>
                  <p>R$ {metrics.total_amount_spent.toFixed(2)}</p>
                </div>
                <div className={styles.card}>
                  <h3>Total de Uso</h3>
                  <p>{metrics.usage_count}</p>
                </div>
                <div className={styles.card}>
                  <h3>Usuários Diferentes</h3>
                  <p>{metrics.unique_user_count}</p>
                </div>
                <div className={styles.card}>
                  <h3>Média Gasto por Uso</h3>
                  <p>R$ {metrics.average_amount_spent_per_use.toFixed(2)}</p>
                </div>
                <div className={styles.card}>
                  <h3>Média de Usos por Usuário</h3>
                  <p>{metrics.average_uses_per_user.toFixed(2)}</p>
                </div>
              </div>
            )}
          </section>
          <Metrics/>
        </main>
      </div>
    </>
  )
}

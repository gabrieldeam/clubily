// src/components/Dashboard/Dashboard.tsx (atualizado)
'use client';

import Header from '@/components/Header/Header';
import CashbackOverview from '@/components/CashbackOverview/CashbackOverview';
import styles from './Dashboard.module.css';
import MetricsPoints from '@/components/MetricsPoints/MetricsPoints';
import MetricsPurchase from '@/components/MetricsPurchase/MetricsPurchase';
import MetricsLoyalty from '@/components/MetricsLoyalty/MetricsLoyalty';

export default function Dashboard() {
  return (
    <>
      <Header />
      <div className={styles.container}>
        <CashbackOverview />
        <MetricsPoints />
        <MetricsPurchase />
        <MetricsLoyalty/>
      </div>
    </>
  );
}

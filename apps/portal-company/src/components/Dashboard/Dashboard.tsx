// src/components/Dashboard/Dashboard.tsx (atualizado)
'use client';

import React, { useState } from 'react';
import Header from '@/components/Header/Header';
import CashbackOverview from '@/components/CashbackOverview/CashbackOverview';
import styles from './Dashboard.module.css';
import MetricsPoints from '@/components/MetricsPoints/MetricsPoints';
import MetricsPurchase from '@/components/MetricsPurchase/MetricsPurchase';
import MetricsLoyalty from '@/components/MetricsLoyalty/MetricsLoyalty';
import { useSearchParams } from 'next/navigation';
import WelcomeSlider from '@/components/WelcomeSlider/WelcomeSlider';

export default function Dashboard() {
  const searchParams = useSearchParams();
  const initialShow = Boolean(searchParams.get('welcome'));
  const [showWelcome, setShowWelcome] = useState(initialShow);

  return (
    <>
      <Header />
      {showWelcome && (
        <WelcomeSlider onClose={() => setShowWelcome(false)} />
      )}
      <div className={styles.container}>
        <CashbackOverview />
        <MetricsPoints />
        <MetricsPurchase />
        <MetricsLoyalty/>
      </div>
    </>
  );
}

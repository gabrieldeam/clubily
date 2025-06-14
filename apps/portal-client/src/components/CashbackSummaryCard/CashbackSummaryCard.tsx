'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getCashbackSummary } from '@/services/cashbackService';
import type { CashbackSummary } from '@/types/cashback';
import styles from './CashbackSummaryCard.module.css';

export default function CashbackSummaryCard() {
  const [summary, setSummary] = useState<CashbackSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
   useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await getCashbackSummary(/* pode passar userId se necessário */);
        setSummary(res.data);
      } catch (err) {
        console.error(err);
        setError('Falha ao carregar resumo de cashback');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className={styles.card}><p className={styles.loading}>Carregando resumo…</p></div>;
  }

  if (error || !summary) {
    return <div className={styles.card}><p className={styles.error}>{error ?? 'Resumo indisponível'}</p></div>;
  }

  const { total_balance, next_expiration } = summary;
  const formattedBalance = total_balance.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
  const formattedExpiration = next_expiration
    ? new Date(next_expiration).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '—';

  return (
    <div className={styles.cardConteiner}>
        <div className={styles.card}>
          <div className={styles.balanceConteiner}>
            <Image src="/icons/reembolso-alt.svg" alt="" width={32} height={32} />
            <div className={styles.balance}>
              <span className={styles.balanceLabel}>Cashback</span>
              <span className={styles.balanceValue}>{formattedBalance}</span>
           </div>
          </div>
          {!isMobile && (
            <div className={styles.expiration}>
              <span className={styles.expLabel}>Próxima expiração</span>
              <span className={styles.expValue}>{formattedExpiration}</span>
            </div>
          )}          
          <div className={styles.footer}>
            <Link href="/cashbacks">
              <button className={styles.button}>Ver todos</button>
            </Link>
          </div>
        </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getWalletsSummary } from '@/services/walletService';
import type { WalletSummary } from '@/types/wallet';
import styles from './CashbackSummaryCard.module.css';

export default function CashbackSummaryCard() {
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // detecta mudança de viewport
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // busca o resumo da carteira
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await getWalletsSummary();
        setSummary(res.data);
      } catch (err) {
        console.error(err);
        setError('Falha ao carregar resumo da carteira');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // não renderiza nada enquanto carrega
  if (loading) {
    return null;
  }

  // mostra apenas erro se ocorrer
  if (error || !summary) {
    return (
      <div className={styles.cardConteiner}>
        <div className={styles.card}>
          <p className={styles.error}>{error ?? 'Resumo indisponível'}</p>
        </div>
      </div>
    );
  }

  const { total_balance, wallet_count } = summary;
  const formattedBalance = total_balance.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  return (
    <div className={styles.cardConteiner}>
      <div className={styles.card}>
        <div className={styles.balanceConteiner}>
          <Image src="/icons/reembolso-alt.svg" alt="" width={32} height={32} />
          <div className={styles.balance}>
            <span className={styles.balanceLabel}>Saldo total de cash back</span>
            <span className={styles.balanceValue}>{formattedBalance}</span>
          </div>
        </div>
        {!isMobile && (
          <div className={styles.expiration}>
            <span className={styles.expLabel}>Carteiras de cash back</span>
            <span className={styles.expValue}>{wallet_count}</span>
          </div>
        )}
        <div className={styles.footer}>
          <Link href="/cashbacks">
            <button className={styles.button}>Ver detalhes</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
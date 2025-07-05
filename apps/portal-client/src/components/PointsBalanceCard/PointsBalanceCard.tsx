// src/components/PointsBalanceCard/PointsBalanceCard.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getUserPointsBalance } from '@/services/pointsUserService';
import type { UserPointsWalletRead } from '@/types/pointsUserWallet';
import styles from './PointsBalanceCard.module.css';

export default function PointsBalanceCard() {
  const [balanceData, setBalanceData] = useState<UserPointsWalletRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // valor manual de progresso (em %). Depois você substituirá pela API.
  const progress = 75;

  useEffect(() => {
    setLoading(true);
    getUserPointsBalance()
      .then(res => setBalanceData(res.data))
      .catch(err => {
        console.error(err);
        setError('Não foi possível carregar o saldo.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className={styles.card}>Carregando saldo...</div>;
  }

  if (error) {
    return <div className={styles.card}>{error}</div>;
  }

  return (
    <div className={styles.content}>
      <div className={styles.card}>
        <div
          className={styles.progressCircle}
          style={{
            // desenha o arco: de 0 a progress% em indigo, o resto em cinza
            background: `conic-gradient(#000000 0% ${progress}%, #E5E7EB ${progress}% 100%)`
          }}
        >
          <div className={styles.cardImage}>
            <Image src="/icons/conquista.svg" alt="" width={42} height={42} />
          </div>
        </div>

        <div className={styles.cardText}>
          <p className={styles.title}>Saldo de Pontos</p>
          <Link href="/leaderboard">
            <div className={styles.balance}>
              <span>{balanceData ? balanceData.balance : 0}</span>
            <p>Pts</p>
          </div>
          </Link>
          
          <div className={styles.footer}>
            Atualizado em{' '}
            {balanceData
              ? new Date(balanceData.updated_at).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })
              : '-'}
          </div>
        </div>
      </div>
      <div className={styles.link}>
        <Link href="/points">
          <button className={styles.button}>Extrato</button>
        </Link>
      </div>
      <div className={styles.linkTwo}>
        <Link href="/points">
          <Image src="/icons/extrato.svg" alt="" width={22} height={22} />
        </Link>
      </div>
      
    </div>
  );
}

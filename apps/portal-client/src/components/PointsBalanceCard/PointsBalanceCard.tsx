// src/components/PointsBalanceCard/PointsBalanceCard.tsx
'use client';

import { useEffect, useState } from 'react';
import { getUserPointsBalance } from '@/services/pointsUserService';
import type { UserPointsWalletRead } from '@/types/pointsUserWallet';
import styles from './PointsBalanceCard.module.css';

export default function PointsBalanceCard() {
  const [balanceData, setBalanceData] = useState<UserPointsWalletRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <div className={styles.card}>
      <h3 className={styles.title}>Saldo de Pontos</h3>
      <div className={styles.balance}>
        {balanceData ? balanceData.balance : 0}
      </div>
      <div className={styles.footer}>
        Atualizado em{' '}
        {balanceData
          ? new Date(balanceData.updated_at).toLocaleDateString('pt-BR', {
              day: '2-digit', month: '2-digit', year: 'numeric'
            })
          : '-'}
      </div>
    </div>
  );
}
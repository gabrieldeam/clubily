'use client';

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getUserPointsBalance } from '@/services/pointsUserService';
import { getMyMilestones, getNextMilestone } from '@/services/milestoneService';
import type { UserPointsWalletRead } from '@/types/pointsUserWallet';
import type { UserMilestoneRead, NextMilestoneRead } from '@/types/milestone';
import styles from './PointsBalanceCard.module.css';

export default function PointsBalanceCard() {
  /* ---------- State ---------- */
  const [balanceData, setBalanceData] = useState<UserPointsWalletRead | null>(null);
  const [milestones, setMilestones] = useState<UserMilestoneRead[]>([]);
  const [nextData, setNextData] = useState<NextMilestoneRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';

  /* ---------- Fetch ---------- */
  useEffect(() => {
    async function fetchAll() {
      try {
        const [balRes, myRes] = await Promise.all([
          getUserPointsBalance(),
          getMyMilestones(),
        ]);

        setBalanceData(balRes.data);

        /* estrutura flexível p/ { items: [...] } ou [] */
        const raw = myRes.data as unknown;
        const arr = Array.isArray(raw)
          ? raw
          : (raw as { items?: UserMilestoneRead[] }).items ?? [];
        setMilestones(arr);

        /* next milestone pode retornar 404 se já no topo */
        try {
          const nxt = await getNextMilestone();
          setNextData(nxt.data);
        } catch {
          setNextData(null);
        }
      } catch (err) {
        console.error(err);
        setError('Não foi possível carregar os dados.');
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, []);

  /* ---------- Cálculo do marco atual + progresso ---------- */
  const { currentMilestone, progress } = useMemo(() => {
    if (!balanceData) return { currentMilestone: null, progress: 0 };

    const ordered = [...milestones].sort((a, b) => a.milestone.points - b.milestone.points);
    const achieved = ordered.filter(m => m.achieved_at);
    const current = achieved.at(-1) ?? null;

    /* Progresso baseado no próximo milestone (caso exista) */
    if (nextData) {
      const lower = current?.milestone.points ?? 0;
      const upper = nextData.points;
      const pct = Math.min(100, ((balanceData.balance - lower) / (upper - lower)) * 100);
      return { currentMilestone: current, progress: pct };
    }

    /* Já no topo */
    return { currentMilestone: current, progress: 100 };
  }, [balanceData, milestones, nextData]);

  /* ---------- Loading ---------- */
  if (loading) {
    return null;
  }

  /* ---------- Erro ---------- */
  if (error) {
    return <div className={styles.card}>{error}</div>;
  }

  /* ---------- Render ---------- */
  return (
    <div className={styles.content}>
      <div className={styles.card}>
        {/* Círculo com progresso */}
        <div
          className={styles.progressCircle}
          style={{ background: `conic-gradient(#000000 0% ${progress}%, #E5E7EB ${progress}% 100%)` }}
        >
          <div className={styles.cardImage}>
            {currentMilestone ? (
              <Image
                loader={({ src }) => src}
                src={`${baseUrl}${currentMilestone.milestone.image_url}`}
                alt={currentMilestone.milestone.title}
                fill
                sizes="80px"
              />
            ) : (
              <Image src="/icons/conquista.svg" alt="" fill sizes="80px" />
            )}
          </div>
        </div>

        {/* Texto e saldo */}
        <div className={styles.cardText}>
          <p className={styles.title}>Saldo de Pontos</p>

          <Link href="/leaderboard">
            <div className={styles.balance}>
              <span>{balanceData?.balance ?? 0}</span>
              <p>Pts</p>
            </div>
          </Link>

          <div className={styles.footer}>
            Atualizado em{' '}
            {new Date(balanceData!.updated_at).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </div>

          {/* Informação do próximo marco */}
          {nextData ? (
            <div className={styles.nextGoal}>
              Mais <strong>{nextData.remaining}</strong> pts para{' '}
              <Link href="/milestones" className={styles.goalLink}>
                {nextData.title}
              </Link>
            </div>
          ) : (
            <div className={styles.nextGoal}>Você atingiu o maior marco 🎉</div>
          )}
        </div>
      </div>

      {/* Ações rápidas */}
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

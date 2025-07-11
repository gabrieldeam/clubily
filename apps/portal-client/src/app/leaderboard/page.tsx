// src/app/leaderboard/page.tsx   ← (ou “/ranking/page.tsx”, conforme seu projeto)
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header/Header';
import {
  getLeaderboardOverall,
  getLeaderboardToday,
  getLeaderboardMonth,
} from '@/services/leaderboardService';
import type { PaginatedLeaderboard } from '@/types/leaderboard';
import type { AxiosResponse } from 'axios';
import styles from './page.module.css';

type Mode = 'overall' | 'today' | 'month';

export default function RankingPage() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>('overall');
  const [data, setData] = useState<PaginatedLeaderboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Para modo “mês”
  const today = new Date();
  const [year, setYear] = useState<number>(today.getUTCFullYear());
  const [month, setMonth] = useState<number>(today.getUTCMonth() + 1);

  useEffect(() => {
    setLoading(true);
    setError(null);

    let fetcher: Promise<AxiosResponse<PaginatedLeaderboard>>;

    if (mode === 'overall') {
      fetcher = getLeaderboardOverall(0, 50);
    } else if (mode === 'today') {
      fetcher = getLeaderboardToday(0, 50);
    } else {
      fetcher = getLeaderboardMonth(year, month, 0, 50);
    }

    fetcher
      .then((res) => setData(res.data))
      .catch(() => setError('Falha ao carregar ranking.'))
      .finally(() => setLoading(false));
  }, [mode, year, month]);

  const topThree = data?.items.slice(0, 3) ?? [];
  const rest = data?.items.slice(3) ?? [];

  return (
    <>
      <Header
        onSearch={(q) => router.push(`/search?name=${encodeURIComponent(q)}`)}
      />

      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Ranking de Pontos</h1>
        </header>

        {/* Tabs */}
        <nav className={styles.tabs}>
          {(['overall', 'today', 'month'] as const).map((tab) => (
            <button
              key={tab}
              className={`${styles.tab} ${
                mode === tab ? styles.tabActive : ''
              }`}
              onClick={() => setMode(tab)}
            >
              {tab === 'overall' ? 'Geral' : tab === 'today' ? 'Hoje' : 'Mês'}
            </button>
          ))}
        </nav>

        {/* Seletor de ano/mês */}
        {mode === 'month' && (
          <div className={styles.monthSelector}>
            <label>
              Ano&nbsp;
              <input
                type="number"
                min={2000}
                max={2100}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              />
            </label>
            <label>
              Mês&nbsp;
              <input
                type="number"
                min={1}
                max={12}
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
              />
            </label>
          </div>
        )}

        {/* Estado de carregamento / erro */}
        {loading && <p className={styles.loading}>Carregando…</p>}
        {error && <p className={styles.error}>{error}</p>}

        {/* Dados */}
        {!loading && data && (
          <>
            {/* Pódio */}
            <section className={styles.podium}>
              {topThree.map((u, i) => (
                <div key={u.user_id} className={styles.podiumCard}>
                  <div className={styles.position}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                  </div>
                  <div className={styles.name}>{u.name}</div>
                  <div className={styles.points}>{u.points} pts</div>
                </div>
              ))}
            </section>

            {/* Demais posições */}
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Posição</th>
                    <th>Usuário</th>
                    <th>Pontos</th>
                  </tr>
                </thead>
                <tbody>
                  {rest.map((u, idx) => (
                    <tr key={u.user_id}>
                      <td>{idx + 4}</td>
                      <td>{u.name}</td>
                      <td>{u.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}

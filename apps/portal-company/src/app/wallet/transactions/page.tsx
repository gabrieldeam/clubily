// src/app/wallet/transactions/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header/Header';
import { listWalletTransactions } from '@/services/walletService';
import { listPointsTransactions } from '@/services/pointsWalletService';
import type {
  PaginatedWalletTransactions,
  WalletTransactionRead
} from '@/types/wallet';
import type {
  PaginatedPointsTransactions,
  PointsTransaction
} from '@/types/pointsWallet';
import styles from './page.module.css';

export default function TransactionsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Derive initial view from URL (?view=credits or ?view=points)
  const param = searchParams.get('view');
  const initialView: 'credits' | 'points' = param === 'points' ? 'points' : 'credits';

  const [view, setView] = useState<'credits' | 'points'>(initialView);
  const [page, setPage] = useState(0);

  // créditos
  const [creditTx, setCreditTx] = useState<WalletTransactionRead[]>([]);
  const [loadingCredit, setLoadingCredit] = useState(true);
  const [totalCredit, setTotalCredit] = useState(0);

  // pontos
  const [pointTx, setPointTx] = useState<PointsTransaction[]>([]);
  const [loadingPoints, setLoadingPoints] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);

  const LIMIT = 10;
  const totalPagesCredit = Math.ceil(totalCredit / LIMIT);
  const totalPagesPoints = Math.ceil(totalPoints / LIMIT);

  // Sempre que mudar de view, resetar página e atualizar a URL
  const switchView = (newView: 'credits' | 'points') => {
    setView(newView);
    setPage(0);
    router.push(`/wallet/transactions?view=${newView}`);
  };

  // fetch créditos
  useEffect(() => {
    if (view !== 'credits') return;
    setLoadingCredit(true);
    listWalletTransactions(page * LIMIT, LIMIT)
      .then(res => {
        const data = res.data as PaginatedWalletTransactions;
        setCreditTx(data.items);
        setTotalCredit(data.total);
      })
      .catch(() => {
        setCreditTx([]);
        setTotalCredit(0);
      })
      .finally(() => setLoadingCredit(false));
  }, [view, page]);

  // fetch pontos
  useEffect(() => {
    if (view !== 'points') return;
    setLoadingPoints(true);
    listPointsTransactions(page * LIMIT, LIMIT)
      .then(res => {
        const data = res.data as PaginatedPointsTransactions;
        setPointTx(data.items);
        setTotalPoints(data.total);
      })
      .catch(() => {
        setPointTx([]);
        setTotalPoints(0);
      })
      .finally(() => setLoadingPoints(false));
  }, [view, page]);

  return (
    <>
      <Header />

      <div className={styles.page}>
        <main className={styles.main}>

          {/*  TABS DE HISTÓRICO  */}
          <div className={styles.historyTabs}>
            <button
              className={`${styles.tabBtn} ${view === 'credits' ? styles.activeTab : ''}`}
              onClick={() => switchView('credits')}
            >
              Créditos
            </button>
            <button
              className={`${styles.tabBtn} ${view === 'points' ? styles.activeTab : ''}`}
              onClick={() => switchView('points')}
            >
              Pontos
            </button>
          </div>

          <section className={styles.paymentsSection}>
            <div className={styles.headerRow}>
              <h4>
                {view === 'credits'
                  ? 'Extrato de Créditos'
                  : 'Extrato de Pontos'}
              </h4>
            </div>

            {view === 'credits' ? (
              loadingCredit ? (
                <p className={styles.loading}>Carregando extrato…</p>
              ) : creditTx.length > 0 ? (
                <>
                  <div className={styles.tableWrapper}>
                    <div className={styles.rowHeader}>
                      <div className={styles.cellName}>ID</div>
                      <div className={styles.cellType}>Tipo</div>
                      <div className={styles.cellAmount}>Valor</div>
                      <div className={styles.cellDesc}>Descrição</div>
                      <div className={styles.cellDate}>Criado em</div>
                    </div>
                    <div className={styles.body}>
                      {creditTx.map(tx => (
                        <div key={tx.id} className={styles.row}>
                          <div className={styles.cellName} data-label="ID">
                            {tx.id.slice(0, 8)}…
                          </div>
                          <div className={styles.cellType} data-label="Tipo">
                            {tx.type === 'credit' ? 'Crédito' : 'Débito'}
                          </div>
                          <div className={styles.cellAmount} data-label="Valor">
                            R$ {Number(tx.amount).toFixed(2)}
                          </div>
                          <div className={styles.cellDesc} data-label="Descrição">
                            {tx.description ?? '-'}
                          </div>
                          <div className={styles.cellDate} data-label="Criado em">
                            {new Date(tx.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={styles.pagination}>
                    <button
                      onClick={() => setPage(p => Math.max(p - 1, 0))}
                      disabled={page === 0}
                    >
                      Anterior
                    </button>
                    <span>
                      Página {page + 1} de {totalPagesCredit}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(p + 1, totalPagesCredit - 1))}
                      disabled={page + 1 >= totalPagesCredit}
                    >
                      Próxima
                    </button>
                  </div>
                </>
              ) : (
                <p className={styles.emptyText}>Nenhuma transação encontrada.</p>
              )
            ) : (
              loadingPoints ? (
                <p className={styles.loading}>Carregando extrato…</p>
              ) : pointTx.length > 0 ? (
                <>
                  <div className={styles.tableWrapper}>
                    <div className={styles.rowHeader}>
                      <div className={styles.cellName}>ID</div>
                      <div className={styles.cellType}>Tipo</div>
                      <div className={styles.cellAmount}>Pontos</div>
                      <div className={styles.cellDesc}>Descrição</div>
                      <div className={styles.cellDate}>Criado em</div>
                    </div>
                    <div className={styles.body}>
                      {pointTx.map(tx => (
                        <div key={tx.id} className={styles.row}>
                          <div className={styles.cellName} data-label="ID">
                            {tx.id.slice(0, 8)}…
                          </div>
                          <div className={styles.cellType} data-label="Tipo">
                            {tx.type === 'credit' ? 'Crédito' : 'Débito'}
                          </div>
                          <div className={styles.cellAmount} data-label="Pontos">
                            {tx.amount} pts
                          </div>
                          <div className={styles.cellDesc} data-label="Descrição">
                            {tx.description ?? '-'}
                          </div>
                          <div className={styles.cellDate} data-label="Criado em">
                            {new Date(tx.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={styles.pagination}>
                    <button
                      onClick={() => setPage(p => Math.max(p - 1, 0))}
                      disabled={page === 0}
                    >
                      Anterior
                    </button>
                    <span>
                      Página {page + 1} de {totalPagesPoints}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(p + 1, totalPagesPoints - 1))}
                      disabled={page + 1 >= totalPagesPoints}
                    >
                      Próxima
                    </button>
                  </div>
                </>
              ) : (
                <p className={styles.emptyText}>Nenhuma transação encontrada.</p>
              )
            )}
          </section>
        </main>
      </div>
    </>
  );
}

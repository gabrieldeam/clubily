// src/app/points/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header/Header';
import Link from 'next/link';
import { getUserPointsTransactions } from '@/services/pointsUserService';
import type {
  PaginatedUserPointsTransactions,
  UserPointsTransactionRead,
} from '@/types/pointsUserWallet';
import styles from './page.module.css';

export default function PointsTransactionsPage() {
  const [data, setData] = useState<PaginatedUserPointsTransactions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const limit = 10;

  const fetchTransactions = (page: number) => {
    setLoading(true);
    setError(null);
    const skip = (page - 1) * limit;
    getUserPointsTransactions(skip, limit)
      .then(res => setData(res.data))
      .catch(err => {
        console.error(err);
        setError('Falha ao carregar extrato.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTransactions(page);
  }, [page]);

  const total = data?.total ?? 0;
  const items = data?.items ?? [];

  return (
    <>
      <Header />
      <div className={styles.container}>
        <main className={styles.main}>
          <h2 className={styles.title}>Extrato de Pontos</h2>

          {loading ? (
            <p className={styles.message}>Carregando transações…</p>
          ) : error ? (
            <p className={styles.error}>{error}</p>
          ) : items.length === 0 ? (
            <p className={styles.message}>Não há transações.</p>
          ) : (
            <>
              <div className={styles.summary}>
                Total de transações: <strong>{total}</strong>
              </div>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Tipo</th>
                      <th>Quantidade</th>
                      <th>Descrição</th>
                      <th>Empresa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((tx: UserPointsTransactionRead) => (
                      <tr key={tx.id}>
                        <td>{new Date(tx.created_at).toLocaleString('pt-BR')}</td>
                        <td>{tx.type === 'award' ? 'Crédito' : 'Ajuste'}</td>
                        <td>{tx.amount}</td>
                        <td>{tx.description || '—'}</td>
                        <td>
                          <Link href={`/companies/${tx.company_id}`}>
                            {tx.company_name || '—'}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={styles.pagination}>
                <button
                  className={styles.pageButton}
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Anterior
                </button>
                <span className={styles.pageInfo}>Página {page}</span>
                <button
                  className={styles.pageButton}
                  disabled={!data || page * limit >= total}
                  onClick={() => setPage(p => p + 1)}
                >
                  Próxima
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}
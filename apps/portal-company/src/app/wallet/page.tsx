// src/app/wallet/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header/Header';
import Button from '@/components/Button/Button';
import { getBalance, listPayments } from '@/services/companyPaymentService';
import type { CompanyPaymentRead, PaginatedPayments } from '@/types/companyPayment';
import styles from './page.module.css';

export default function WalletPage() {
  const [balance, setBalance] = useState<number>(0);
  const [payments, setPayments] = useState<CompanyPaymentRead[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);

  // paginação
  const LIMIT = 10;
  const [page, setPage] = useState(0);

  // total para paginação
  const [totalPayments, setTotalPayments] = useState(0);

  useEffect(() => {
    getBalance()
      .then(res => setBalance(res.data))
      .catch(() => setBalance(0))
      .finally(() => setLoadingBalance(false));
  }, []);

  useEffect(() => {
    setLoadingPayments(true);
    listPayments(page * LIMIT, LIMIT)
      .then(res => {
        const data = res.data as PaginatedPayments;
        setPayments(data.items);
        setTotalPayments(data.total);
      })
      .catch(() => {
        setPayments([]);
        setTotalPayments(0);
      })
      .finally(() => setLoadingPayments(false));
  }, [page]);

  const totalPages = Math.ceil(totalPayments / LIMIT);

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        {/* Saldo */}
        <div className={styles.balanceDiv}>
            <section className={styles.balanceSection}>
                <div>
                    <h5>Saldo Disponível</h5>
                    {loadingBalance ? (
                        <p>Carregando saldo...</p>
                    ) : (
                        <div className={styles.balanceValue}>
                        R$ {balance.toFixed(2)}
                        </div>
                    )}
                </div>
                <Link href="/credits">
                    <button className={styles.button}>Comprar Créditos</button>
                </Link>
            </section>
            <section className={styles.balanceSection}>
                
            </section>
        </div>

        {/* Histórico de cobranças */}
        <section className={styles.paymentsSection}>
          <div className={styles.headerRow}>
            <h4>Histórico</h4>
          </div>

          {loadingPayments ? (
            <p className={styles.loading}>Carregando cobranças...</p>
          ) : payments.length > 0 ? (
            <>
              <div className={styles.tableWrapper}>
                <div className={styles.rowHeader}>
                  <div className={styles.cellName}>ID</div>
                  <div className={styles.cellEmail}>Valor</div>
                  <div className={styles.cellPhone}>Status</div>
                  <div className={styles.cellPhone}>Criado em</div>
                </div>
                <div className={styles.body}>
                  {payments.map((p) => (
                    <div key={p.id} className={styles.row}>
                      <div className={styles.cellName} data-label="ID">
                        {p.id.slice(0, 8)}…
                      </div>
                      <div className={styles.cellEmail} data-label="Valor">
                        R$ {p.amount.toFixed(2)}
                      </div>
                      <div className={styles.cellPhone} data-label="Status">
                        <span className={styles[p.status.toLowerCase()]}>
                          {p.status}
                        </span>
                      </div>
                      <div className={styles.cellPhone} data-label="Criado em">
                        {new Date(p.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.pagination}>
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 0))}
                  disabled={page === 0}
                >
                  Anterior
                </button>
                <span>Página {page + 1} de {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
                  disabled={page + 1 >= totalPages}
                >
                  Próxima
                </button>
              </div>
            </>
          ) : (
            <p className={styles.emptyText}>Nenhuma cobrança encontrada.</p>
          )}
        </section>
      </main>
    </div>
  );
}

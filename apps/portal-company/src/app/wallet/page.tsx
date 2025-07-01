// src/app/wallet/page.tsx
'use client';

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header/Header'
import { listPayments } from '@/services/companyPaymentService'
import { getWallet } from '@/services/walletService'
import { getPointsBalance } from '@/services/pointsWalletService'
import { historyPoints } from '@/services/pointPurchaseService'
import type { CompanyPaymentRead, PaginatedPayments } from '@/types/companyPayment'
import type { PointPurchaseRead, PaginatedPointPurchases } from '@/types/pointPurchase'
import styles from './page.module.css'

export default function WalletPage() {
  // --- Créditos ---
  const [creditBalance, setCreditBalance] = useState<number>(0)
  const [loadingCredit, setLoadingCredit] = useState(true)

  // --- Pontos ---
  const [pointsBalance, setPointsBalance] = useState<number>(0)
  const [loadingPoints, setLoadingPoints] = useState(true)

  // --- Histórico de cobranças (créditos) ---
  const [payments, setPayments] = useState<CompanyPaymentRead[]>([])
  const [loadingPayments, setLoadingPayments] = useState(true)
  const [totalPayments, setTotalPayments] = useState(0)

  // --- Histórico de compras de pontos ---
  const [purchases, setPurchases] = useState<PointPurchaseRead[]>([])
  const [loadingPurchases, setLoadingPurchases] = useState(true)
  const [totalPurchases, setTotalPurchases] = useState(0)

  // paginação
  const LIMIT = 10
  const [page, setPage] = useState(0)

  // qual histórico está ativo: 'credits' ou 'points'
  const [view, setView] = useState<'credits' | 'points'>('credits')

  // Busca saldo de créditos
  useEffect(() => {
    getWallet()
      .then(res => setCreditBalance(Number(res.data.balance)))
      .catch(() => setCreditBalance(0))
      .finally(() => setLoadingCredit(false))
  }, [])

  // Busca saldo de pontos
  useEffect(() => {
    getPointsBalance()
      .then(res => setPointsBalance(res.data.balance))
      .catch(() => setPointsBalance(0))
      .finally(() => setLoadingPoints(false))
  }, [])

  // Busca histórico de cobranças
  useEffect(() => {
    if (view !== 'credits') return
    setLoadingPayments(true)
    listPayments(page * LIMIT, LIMIT)
      .then(res => {
        const data = res.data as PaginatedPayments
        setPayments(data.items)
        setTotalPayments(data.total)
      })
      .catch(() => {
        setPayments([])
        setTotalPayments(0)
      })
      .finally(() => setLoadingPayments(false))
  }, [view, page])

  // Busca histórico de compras de pontos
  useEffect(() => {
    if (view !== 'points') return
    setLoadingPurchases(true)
    historyPoints(page * LIMIT, LIMIT)
      .then(res => {
        const data = res.data as PaginatedPointPurchases
        setPurchases(data.items)
        setTotalPurchases(data.total)
      })
      .catch(() => {
        setPurchases([])
        setTotalPurchases(0)
      })
      .finally(() => setLoadingPurchases(false))
  }, [view, page])

  const totalPagesCredits = Math.ceil(totalPayments / LIMIT)
  const totalPagesPoints  = Math.ceil(totalPurchases / LIMIT)

  return (
    <>
      <Header />

      <div className={styles.page}>
        <main className={styles.main}>

          {/*  SALDOS  */}
          <div className={styles.balanceDiv}>
            {/* Créditos */}
            <section className={styles.balanceSection}>
              <div>
                <h5>Saldo de Créditos</h5>
                {loadingCredit ? (
                  <p>Carregando saldo de créditos…</p>
                ) : (
                  <div className={styles.balanceValue}>
                    R$ {creditBalance.toFixed(2)}
                  </div>
                )}
              </div>
              <div className={styles.linkDiv}>
                <Link href="/wallet/transactions?view=credits">
                  <button className={styles.button}>Extrato</button>
                </Link>
                <Link href="/credits">
                  <button className={styles.button}>Comprar Créditos</button>
                </Link>
              </div>
            </section>

            {/* Pontos */}
            <section className={styles.balanceSection}>
              <div>
                <h5>Saldo de Pontos</h5>
                {loadingPoints ? (
                  <p>Carregando saldo de pontos…</p>
                ) : (
                  <div className={styles.balanceValue}>
                    {pointsBalance.toLocaleString()} pts
                  </div>
                )}
              </div>
              <div className={styles.linkDiv}>
                <Link href="/wallet/transactions?view=points">
                  <button className={styles.button}>Extrato</button>
                </Link>
                <Link href="/points">
                  <button className={styles.button}>Comprar Pontos</button>
                </Link>
              </div>
            </section>
          </div>

          {/*  TABS DE HISTÓRICO  */}
          <div className={styles.historyTabs}>
            <button
              className={`${styles.tabBtn} ${view === 'credits' ? styles.activeTab : ''}`}
              onClick={() => { setView('credits'); setPage(0) }}
            >
              Créditos
            </button>
            <button
              className={`${styles.tabBtn} ${view === 'points' ? styles.activeTab : ''}`}
              onClick={() => { setView('points'); setPage(0) }}
            >
              Pontos
            </button>
          </div>

          {/*  HISTÓRICO  */}
          <section className={styles.paymentsSection}>
            <div className={styles.headerRow}>
              <h4>
                {view === 'credits'
                  ? 'Histórico de Cobranças'
                  : 'Histórico de Compras de Pontos'}
              </h4>
            </div>

            {view === 'credits' ? (
              loadingPayments ? (
                <p className={styles.loading}>Carregando cobranças…</p>
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
                      {payments.map(p => (
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
                      onClick={() => setPage(p => Math.max(p - 1, 0))}
                      disabled={page === 0}
                    >
                      Anterior
                    </button>
                    <span>
                      Página {page + 1} de {totalPagesCredits}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(p + 1, totalPagesCredits - 1))}
                      disabled={page + 1 >= totalPagesCredits}
                    >
                      Próxima
                    </button>
                  </div>
                </>
              ) : (
                <p className={styles.emptyText}>Nenhuma cobrança encontrada.</p>
              )
            ) : (
              loadingPurchases ? (
                <p className={styles.loading}>Carregando compras de pontos…</p>
              ) : purchases.length > 0 ? (
                <>
                  <div className={styles.tableWrapper}>
                    <div className={styles.rowHeader}>
                      <div className={styles.cellName}>ID</div>
                      <div className={styles.cellEmail}>Valor</div>
                      <div className={styles.cellPhone}>Status</div>
                      <div className={styles.cellPhone}>Criado em</div>
                    </div>
                    <div className={styles.body}>
                      {purchases.map(p => (
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
                <p className={styles.emptyText}>Nenhuma compra de pontos encontrada.</p>
              )
            )}
          </section>
        </main>
      </div>
    </>
  )
}

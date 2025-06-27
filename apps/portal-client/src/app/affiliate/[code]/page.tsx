// src/app/affiliate/[code]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header/Header';
import CommissionWithdrawalModal from '@/components/CommissionWithdrawalModal/CommissionWithdrawalModal';
import {
  getCompaniesByReferralCode,
} from '@/services/companyService';
import {
  getCommissionBalance,
  listCommissionHistory,
  listCommissionWithdrawals,
} from '@/services/commissionService';
import type { CompanyRead } from '@/types/company';
import type {
  CommissionBalance,
  PaginatedCommissionTx,
} from '@/types/commission';
import type {
  CommissionWithdrawalRead,
} from '@/types/commission';
import styles from './page.module.css';

export default function AffiliatePage() {
  const { code } = useParams() as { code: string };
  const router = useRouter();

  // empresas
  const [companies, setCompanies] = useState<CompanyRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // comissão
  const [balance, setBalance] = useState<CommissionBalance | null>(null);
  const [loadingBal, setLoadingBal] = useState(true);
  const [errorBal, setErrorBal] = useState<string | null>(null);

  // histórico
  const [history, setHistory] = useState<PaginatedCommissionTx | null>(null);
  const [loadingHist, setLoadingHist] = useState(true);
  const [errorHist, setErrorHist] = useState<string | null>(null);
  const [histLimit, setHistLimit] = useState(5);
  const [histPage, setHistPage] = useState(1);

  // saques
  const [withdrawals, setWithdrawals] = useState<CommissionWithdrawalRead[]>([]);
  const [loadingW, setLoadingW] = useState(true);
  const [errorW, setErrorW] = useState<string | null>(null);
  const [wLimit, setWLimit] = useState(5);
  const [showAllW, setShowAllW] = useState(false);

  // modal saque
  const [openModal, setOpenModal] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';

  // 1) busca empresas
  useEffect(() => {
    if (!code) return;
    getCompaniesByReferralCode(code)
      .then(res => setCompanies(res.data))
      .catch(() => setError('Não foi possível carregar as empresas.'))
      .finally(() => setLoading(false));
  }, [code]);

  // 2) saldo
  useEffect(() => {
    setLoadingBal(true);
    getCommissionBalance()
      .then(res => setBalance(res.data))
      .catch(() => setErrorBal('Não foi possível carregar o saldo de comissão.'))
      .finally(() => setLoadingBal(false));
  }, []);

  // 3) histórico
  useEffect(() => {
    setLoadingHist(true);
    setErrorHist(null);
    const skip = (histPage - 1) * histLimit;
    listCommissionHistory(skip, histLimit)
      .then(res => setHistory(res.data))
      .catch(() => setErrorHist('Não foi possível carregar o histórico.'))
      .finally(() => setLoadingHist(false));
  }, [histLimit, histPage]);

  // 4) saques
  useEffect(() => {
    setLoadingW(true);
    setErrorW(null);
    listCommissionWithdrawals()
      .then(res => {
        const all = res.data;
        setWithdrawals(all.slice(0, wLimit));
      })
      .catch(() => setErrorW('Não foi possível carregar os saques.'))
      .finally(() => setLoadingW(false));
  }, [wLimit, showAllW]);

  const formattedBalance = balance?.balance.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }) ?? '—';

  return (
    <>
      <Header onSearch={q => router.push(`/search?name=${encodeURIComponent(q)}`)} />

      <CommissionWithdrawalModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={() => {
          // ao concluir saque, recarrega lista e saldo
          setOpenModal(false);
          setWLimit(5);
        }}
      />

      <div className={styles.container}>

        {/* ─── SALDO & BOTÃO SAQUE ────────────────────────── */}
        <div className={styles.gridItem}>
          <div>
            <h4>Saldo de Comissão</h4>
            {loadingBal
              ? <p className={styles.loading}>Carregando saldo…</p>
              : errorBal
                ? <p className={styles.error}>{errorBal}</p>
                : <p className={styles.balanceValue}>{formattedBalance}</p>
            }
          </div>
          <button
            className={styles.categories}
            onClick={() => setOpenModal(true)}
          >
            Solicitar Saque
          </button>
        </div>

        {/* ─── EMPRESAS AFILIADAS ────────────────────────── */}
        <section className={styles.gridItemMap}>
          <h4>Empresas afiliadas</h4>
          {loading && <p className={styles.loading}>Carregando empresas…</p>}
          {error && <p className={styles.error}>{error}</p>}

          {!loading && !error && (
            companies.length > 0 ? (
              <div className={styles.companiesList}>
                {companies.map(comp => (
                  <div key={comp.id} className={styles.companyCard}>
                    <div className={styles.companyInfo}>
                      {comp.logo_url ? (
                        <Image
                          src={`${baseUrl}${comp.logo_url}`}
                          alt={comp.name}
                          width={80}
                          height={80}
                          className={styles.companyLogo}
                        />
                      ) : (
                        <div className={styles.companyLogo}>
                          {comp.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h5 className={styles.companyName}>{comp.name}</h5>
                        {comp.description && <p className={styles.companyDesc}>{comp.description}</p>}
                      </div>
                    </div>
                    <Link href={`/companies/${comp.id}`} className={styles.companyButton}>
                      Ver empresa
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.loading}>Nenhuma empresa encontrada para este código.</p>
            )
          )}
        </section>

        {/* ─── HISTÓRICO DE COMISSÃO ──────────────────────── */}
        <section className={styles.historySection}>
          <h4>Histórico de Comissão</h4>
          {loadingHist &&   <p className={styles.loading}>Carregando histórico…</p>}
          {errorHist &&     <p className={styles.error}>{errorHist}</p>}
          {!loadingHist && !errorHist && history && (
            <>
              <ul className={styles.historyList}>
                {history.items.map(tx => (
                  <li key={tx.id} className={styles.historyItem}>
                    <span className={styles.txDate}>
                      {new Date(tx.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    <span className={styles.txDesc}>{tx.type}</span>
                    <span className={styles.txAmount}>
                      {tx.amount.toLocaleString('pt-BR',{ style:'currency',currency:'BRL' })}
                    </span>
                  </li>
                ))}
              </ul>
              <div className={styles.historyFooter}>
                {!showAllW && history.total > 5 && (
                  <button
                    className={styles.loadMoreBtn}
                    onClick={() => { setHistLimit(10); setHistPage(1); }}
                  >
                    Ver mais
                  </button>
                )}
                {showAllW && (
                  <div className={styles.pagination}>
                    <button disabled={histPage===1} onClick={() => setHistPage(h=>h-1)}>Anterior</button>
                    <span>Página {histPage}</span>
                    <button disabled={(histPage*histLimit)>=history.total} onClick={() => setHistPage(h=>h+1)}>Próxima</button>
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        {/* ─── SAQUES SOLICITADOS ───────────────────────── */}
        <section className={styles.historySection}>
          <h4>Suas Solicitações de Saque</h4>
          {loadingW && <p className={styles.loading}>Carregando saques…</p>}
          {errorW &&   <p className={styles.error}>{errorW}</p>}
          {!loadingW && !errorW && (
            <>
              <ul className={styles.historyList}>
                {withdrawals.map(w => (
                  <li key={w.id} className={styles.historyItem}>
                    <span className={styles.txDate}>
                      {new Date(w.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    <span className={styles.txDesc}>Saque {w.status}</span>
                    <span className={styles.txAmount}>
                      {w.amount.toLocaleString('pt-BR',{ style:'currency',currency:'BRL' })}
                    </span>
                  </li>
                ))}
              </ul>
              {withdrawals.length > 5 && (
                <button
                  className={styles.loadMoreBtn}
                  onClick={() => setWLimit(10)}
                >
                  Ver mais
                </button>
              )}
            </>
          )}
        </section>

      </div>
    </>
  );
}

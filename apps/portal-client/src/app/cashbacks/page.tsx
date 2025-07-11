// src/app/cashbacks/page.tsx
'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  listCashbackCompanies,
  listCashbacks,
  listCashbacksByCompany,
} from '@/services/cashbackService';
import { getMyCompanyWallet, listWalletDebits } from '@/services/walletService';
import type {
  UserCashbackCompany,
  PaginatedCashbacks,
} from '@/types/cashback';
import type { WalletTransactionRead } from '@/types/wallet';

import Header from '@/components/Header/Header';
import styles from './page.module.css';

type ViewMode = 'cashbacks' | 'debits';

export default function CashbacksPage() {
  const router = useRouter();
  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';

  // —— Empresas (infinite scroll) ——
  const [companies, setCompanies] = useState<UserCashbackCompany[]>([]);
  const [compSkip, setCompSkip] = useState(0);
  const compLimit = 10;
  const [compTotal, setCompTotal] = useState(0);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const didLoadRef = useRef(false);

  // —— Saldos por empresa ——
  const [wallets, setWallets] = useState<Record<string, number>>({});
  const [loadingWallets, setLoadingWallets] = useState<Record<string, boolean>>({});

  // —— Cashbacks ——
  const [cashbacks, setCashbacks] = useState<PaginatedCashbacks | null>(null);
  const [page, setPage] = useState(1);
  const cbLimit = 10;
  const [loadingCashbacks, setLoadingCashbacks] = useState(false);

  // —— Débitos ——
  const [debits, setDebits] = useState<WalletTransactionRead[] | null>(null);
  const [loadingDebits, setLoadingDebits] = useState(false);
  const [errorDebits, setErrorDebits] = useState<string | null>(null);

  // —— Seleção / modo de visão ——
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('cashbacks');

  // Carrega mais empresas
  const loadMoreCompanies = useCallback(async () => {
    if (loadingCompanies) return;
    if (compTotal && compSkip >= compTotal) return;

    setLoadingCompanies(true);
    try {
      const res = await listCashbackCompanies(compSkip, compLimit);
      const newItems = res.data.items;
      setCompTotal(res.data.total);
      setCompSkip(prev => prev + compLimit);
      setCompanies(prev => {
        const filtered = newItems.filter(item =>
          !prev.some(p => p.company_id === item.company_id)
        );
        return [...prev, ...filtered];
      });
    } catch (error: unknown) {
      console.error(error);
    } finally {
      setLoadingCompanies(false);
    }
  }, [compSkip, compTotal, loadingCompanies]);

  // Inicial
  useEffect(() => {
    if (didLoadRef.current) return;
    didLoadRef.current = true;
    loadMoreCompanies();
  }, [loadMoreCompanies]);

  // Infinite scroll horizontal
  useEffect(() => {
    const onScroll = () => {
      const el = scrollRef.current;
      if (el && el.scrollLeft + el.clientWidth >= el.scrollWidth - 50) {
        loadMoreCompanies();
      }
    };
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', onScroll);
      return () => el.removeEventListener('scroll', onScroll);
    }
  }, [loadMoreCompanies]);

  // Busca cashbacks
  useEffect(() => {
    if (viewMode !== 'cashbacks') return;
    const fetch = async () => {
      setLoadingCashbacks(true);
      setCashbacks(null);
      const skip = (page - 1) * cbLimit;
      try {
        const res = selectedCompany
          ? await listCashbacksByCompany(selectedCompany, skip, cbLimit)
          : await listCashbacks(skip, cbLimit);
        setCashbacks(res.data);
      } catch (error: unknown) {
        console.error(error);
      } finally {
        setLoadingCashbacks(false);
      }
    };
    fetch();
  }, [page, selectedCompany, viewMode]);

  // Busca débitos
  useEffect(() => {
    if (viewMode !== 'debits') return;
    if (!selectedCompany) {
      setDebits(null);
      return;
    }
    setLoadingDebits(true);
    setErrorDebits(null);
    listWalletDebits(selectedCompany)
      .then(res => setDebits(res.data))
      .catch(err => {
        console.error(err);
        setErrorDebits('Falha ao carregar débitos');
        setDebits([]);
      })
      .finally(() => setLoadingDebits(false));
  }, [selectedCompany, viewMode]);

  // Handler de clique na empresa
  const handleCompanyClick = (companyId: string) => {
    if (selectedCompany === companyId) {
      setSelectedCompany(null);
      setViewMode('cashbacks');
      setPage(1);
      setCashbacks(null);
      setDebits(null);
    } else {
      setSelectedCompany(companyId);
      setViewMode('cashbacks');
      setPage(1);
      setCashbacks(null);
      setDebits(null);
    }
  };

  // Carrega saldo de cada empresa conforme aparecem
  useEffect(() => {
    companies.forEach(c => {
      if (!(c.company_id in wallets) && !loadingWallets[c.company_id]) {
        setLoadingWallets(prev => ({ ...prev, [c.company_id]: true }));
        getMyCompanyWallet(c.company_id)
          .then(res => {
            setWallets(prev => ({ ...prev, [c.company_id]: res.data.balance }));
          })
          .catch(err => {
            console.error(`Erro ao buscar carteira da empresa ${c.company_id}`, err);
            setWallets(prev => ({ ...prev, [c.company_id]: 0 }));
          })
          .finally(() => {
            setLoadingWallets(prev => ({ ...prev, [c.company_id]: false }));
          });
      }
    });
  }, [companies, wallets, loadingWallets]);

  const hasMore =
    cashbacks != null &&
    cashbacks.skip + cashbacks.limit < cashbacks.total;

  return (
    <>
      <Header onSearch={q => router.push(`/search?name=${encodeURIComponent(q)}`)} />
      <div className={styles.container}>

        {/* —— Empresas (infinite scroll) —— */}
        <section className={styles.companiesSection}>
          {loadingCompanies && companies.length === 0 ? (
            <p>Carregando empresas…</p>
          ) : (
            <div className={styles.companiesScroll} ref={scrollRef}>
              {companies.map(c => {
                const balance = wallets[c.company_id];
                const loadingBal = loadingWallets[c.company_id];
                const formattedBal =
                  typeof balance === 'number'
                    ? balance.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })
                    : '—';
                return (
                  <button
                    key={c.company_id}
                    className={`${styles.companyItem} ${
                      selectedCompany === c.company_id ? styles.companyItemActive : ''
                    }`}
                    onClick={() => handleCompanyClick(c.company_id)}
                  >
                    {c.logo_url ? (
                      <Image
                        src={`${baseUrl}${c.logo_url}`}
                        alt={c.name}
                        width={40}
                        height={40}
                        className={styles.companyLogo}
                      />
                    ) : (
                      <div className={styles.companyLogoFallback}>
                        {c.name[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className={styles.companyName}>{c.name}</span>
                    <span className={styles.companyBalance}>
                      {loadingBal ? '…' : formattedBal}
                    </span>
                  </button>
                );
              })}
              {loadingCompanies && <span>…</span>}
            </div>
          )}
        </section>

        {/* —— Seletor de Visão só aparece quando há empresa selecionada —— */}
        {selectedCompany && (
          <div className={styles.viewToggle}>
            <button
              className={viewMode === 'cashbacks' ? styles.activeToggle : ''}
              onClick={() => setViewMode('cashbacks')}
            >
              Cashback
            </button>
            <button
              className={viewMode === 'debits' ? styles.activeToggle : ''}
              onClick={() => setViewMode('debits')}
            >
              Débitos
            </button>
          </div>
        )}

        {/* —— Conteúdo Principal —— */}
        <section className={styles.cashbacksSection}>
          {viewMode === 'cashbacks' ? (
            loadingCashbacks ? (
              <p>Carregando cashbacks…</p>
            ) : !cashbacks?.items.length ? (
              <p>Nenhum cashback encontrado.</p>
            ) : (
              <>
                <ul className={styles.cashbacksList}>
                  {cashbacks.items.map(cb => (
                    <li key={cb.id} className={styles.cashbackItem}>
                      <Link
                        href={`/companies/${cb.program.company_id}`}
                        className={styles.cashbackCompany}
                      >
                        {cb.company_logo_url ? (
                          <Image
                            src={`${baseUrl}${cb.company_logo_url}`}
                            alt={cb.company_name}
                            width={50}
                            height={50}
                            className={styles.companyLogo}
                          />
                        ) : (
                          <div className={styles.companyLogoFallback}>
                            {cb.company_name[0]?.toUpperCase()}
                          </div>
                        )}
                        <span className={styles.companyNameItem}>
                          {cb.company_name}
                        </span>
                      </Link>
                      <div className={styles.cashbackDetails}>
                        <div>
                          <strong>Valor:</strong>{' '}
                          {cb.cashback_value.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </div>
                        <div>
                          <strong>Recebido em:</strong>{' '}
                          {new Date(cb.assigned_at).toLocaleDateString('pt-BR')}
                        </div>
                        <div>
                          <strong>Expira em:</strong>{' '}
                          {new Date(cb.expires_at).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className={styles.pagination}>
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                    Anterior
                  </button>
                  <span>Página {page}</span>
                  <button disabled={!hasMore} onClick={() => setPage(p => p + 1)}>
                    Próxima
                  </button>
                </div>
              </>
            )
          ) : (
            loadingDebits ? (
              <p>Carregando débitos…</p>
            ) : errorDebits ? (
              <p className={styles.error}>{errorDebits}</p>
            ) : !debits?.length ? (
              <p>Nenhum débito encontrado.</p>
            ) : (
              <ul className={styles.cashbacksList}>
                {debits.map(d => (
                  <li key={d.id} className={styles.cashbackItem}>
                    <div className={styles.cashbackDetails}>
                      <div>
                        <strong>Valor:</strong>{' '}
                        {d.amount.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </div>
                      <div>
                        <strong>Data:</strong>{' '}
                        {new Date(d.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )
          )}
        </section>
      </div>
    </>
  );
}

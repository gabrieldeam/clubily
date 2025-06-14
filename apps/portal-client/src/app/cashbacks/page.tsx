// src/app/cashbacks/page.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  listCashbackCompanies,
  listCashbacks,
  listCashbacksByCompany,
} from '@/services/cashbackService';
import type {
  UserCashbackCompany,
  CashbackRead,
  PaginatedCashbacks,
} from '@/types/cashback';

import Header from '@/components/Header/Header';
import styles from './page.module.css';

export default function CashbacksPage() {
  const router = useRouter();
  const baseUrl =
    process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';

  // estados das empresas (infinite scroll)
  const [companies, setCompanies] = useState<UserCashbackCompany[]>([]);
  const [compSkip, setCompSkip] = useState(0);
  const compLimit = 10;
  const [compTotal, setCompTotal] = useState(0);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const didLoadRef = useRef(false);

  // estados dos cashbacks (paginação)
  const [cashbacks, setCashbacks] =
    useState<PaginatedCashbacks | null>(null);
  const [page, setPage] = useState(1);
  const cbLimit = 10;
  const [loadingCashbacks, setLoadingCashbacks] = useState(false);
  const [selectedCompany, setSelectedCompany] =
    useState<string | null>(null);

  // carrega empresas (append sem duplicação)
  const loadMoreCompanies = async () => {
    if (loadingCompanies) return;
    if (compTotal && compSkip >= compTotal) return;

    setLoadingCompanies(true);
    try {
      const res = await listCashbackCompanies(compSkip, compLimit);
      const newItems = res.data.items;

      setCompTotal(res.data.total);
      setCompSkip((prev) => prev + compLimit);

      setCompanies((prev) => {
        const filtered = newItems.filter(
          (item) =>
            !prev.some((p) => p.company_id === item.company_id)
        );
        return [...prev, ...filtered];
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCompanies(false);
    }
  };

  // inicial load (protege contra double-mount do StrictMode)
  useEffect(() => {
    if (didLoadRef.current) return;
    didLoadRef.current = true;
    loadMoreCompanies();
  }, []);

  // infinite scroll horizontal
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
  }, [compSkip, compTotal]);

  // busca cashbacks (genéricos ou filtrados)
  const fetchCashbacks = async () => {
    setLoadingCashbacks(true);
    setCashbacks(null);
    const skip = (page - 1) * cbLimit;
    try {
      let res: { data: PaginatedCashbacks };
      if (selectedCompany) {
        res = await listCashbacksByCompany(
          selectedCompany,
          skip,
          cbLimit
        );
      } else {
        res = await listCashbacks(skip, cbLimit);
      }
      setCashbacks(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCashbacks(false);
    }
  };

  // dispara busca ao mudar de página ou de empresa selecionada
  useEffect(() => {
    fetchCashbacks();
  }, [page, selectedCompany]);

  // handler de clique na empresa
  const handleCompanyClick = (companyId: string) => {
    const next = selectedCompany === companyId ? null : companyId;
    setSelectedCompany(next);
    setPage(1);
    setCashbacks(null);
  };

  const hasMore =
    cashbacks != null &&
    cashbacks.skip + cashbacks.limit < cashbacks.total;

  return (
    <div className={styles.container}>
      <Header
        onSearch={(q) =>
          router.push(`/search?name=${encodeURIComponent(q)}`)
        }
      />

      {/* Empresas (infinite scroll) */}
      <section className={styles.companiesSection}>
        {loadingCompanies && companies.length === 0 ? (
          <p>Carregando empresas…</p>
        ) : (
          <div
            className={styles.companiesScroll}
            ref={scrollRef}
          >
            {companies.map((c) => (
              <button
                key={c.company_id}
                className={`${styles.companyItem} ${
                  selectedCompany === c.company_id
                    ? styles.companyItemActive
                    : ''
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
                <span className={styles.companyName}>
                  {c.name}
                </span>
              </button>
            ))}
            {loadingCompanies && <span>…</span>}
          </div>
        )}
      </section>

      {/* Cashbacks + paginação */}
      <section className={styles.cashbacksSection}>
        {loadingCashbacks ? (
          <p>Carregando cashbacks…</p>
        ) : !cashbacks?.items.length ? (
          <p>Nenhum cashback encontrado.</p>
        ) : (
          <>
            <ul className={styles.cashbacksList}>
              {cashbacks.items.map((cb: CashbackRead) => (
                <li
                  key={cb.id}
                  className={styles.cashbackItem}
                >
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
                      {cb.cashback_value.toLocaleString(
                        'pt-BR',
                        {
                          style: 'currency',
                          currency: 'BRL',
                        }
                      )}
                    </div>
                    <div>
                      <strong>Recebido em:</strong>{' '}
                      {new Date(
                        cb.assigned_at
                      ).toLocaleDateString('pt-BR')}
                    </div>
                    <div>
                      <strong>Expira em:</strong>{' '}
                      {new Date(
                        cb.expires_at
                      ).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className={styles.pagination}>
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </button>
              <span>Página {page}</span>
              <button
                disabled={!hasMore}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

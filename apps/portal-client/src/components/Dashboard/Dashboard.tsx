'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Loading from '@/components/Loading/Loading';
import WelcomeSlider from '@/components/WelcomeSlider/WelcomeSlider';

import { useAddress } from '@/context/AddressContext';
import { listUsedCategories } from '@/services/categoryService';
import { searchCompanies } from '@/services/companyService';

import type { CategoryRead } from '@/types/category';
import type { CompanyRead } from '@/types/company';

import Header from '@/components/Header/Header';
import CashbackSummaryCard from '@/components/CashbackSummaryCard/CashbackSummaryCard';
import PointsBalanceCard from '@/components/PointsBalanceCard/PointsBalanceCard';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { selectedAddress, radiusKm } = useAddress();

  // loading
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  // data
  const [cats, setCats] = useState<CategoryRead[]>([]);
  const [companies, setCompanies] = useState<CompanyRead[]>([]);

  // paginação de empresas
  const [page, setPage] = useState(1);
  const size = 10;
  const [totalPages, setTotalPages] = useState(1);

  // UI - carrossel de categorias
  const listRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  // welcome
  const initialShow = Boolean(searchParams.get('welcome'));
  const [showWelcome, setShowWelcome] = useState(initialShow);

  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';

  // Quando endereço/raio mudarem, resetar a paginação e empresas
  useEffect(() => {
    setPage(1);
    setCompanies([]);
  }, [selectedAddress, radiusKm]);

  // Buscar categorias (independente de empresas)
  useEffect(() => {
    if (!selectedAddress) return;
    let alive = true;
    setLoadingCats(true);
    (async () => {
      try {
        const postal_code = selectedAddress.postal_code;
        const res = await listUsedCategories(postal_code, radiusKm);
        if (!alive) return;
        setCats(res.data);
      } catch {
        if (alive) setCats([]);
      } finally {
        if (alive) setLoadingCats(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [selectedAddress, radiusKm]);

  // Buscar empresas (paginado e independente de categorias)
  useEffect(() => {
    if (!selectedAddress) return;
    let alive = true;
    setLoadingCompanies(true);
    (async () => {
      try {
        const postal_code = selectedAddress.postal_code;
        const res = await searchCompanies(postal_code, radiusKm, page, size);
        if (!alive) return;

        setCompanies(prev =>
          page === 1 ? res.data.items : [...prev, ...res.data.items]
        );
        setTotalPages(Math.ceil(res.data.total / res.data.size));
      } catch {
        if (alive) {
          if (page === 1) setCompanies([]);
        }
      } finally {
        if (alive) setLoadingCompanies(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [selectedAddress, radiusKm, page]);

  const updateArrows = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 0);
    setCanRight(el.scrollWidth - el.clientWidth - el.scrollLeft > 0);
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateArrows);
    window.addEventListener('resize', updateArrows);
    updateArrows();
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [cats.length, updateArrows]);

  const scrollBy = (delta: number) =>
    listRef.current?.scrollBy({ left: delta, behavior: 'smooth' });

  const hasCats = cats.length > 0;
  const hasCompanies = companies.length > 0;

  // Apenas um retângulo de loading no início
  const isLoadingInitial =
    loadingCats && loadingCompanies && !hasCats && !hasCompanies;

  // Estado vazio total (nada encontrado após carregar)
  const showEmptyRegion =
    !loadingCats && !loadingCompanies && !hasCats && !hasCompanies;

  return (
    <>
      <Header onSearch={q => router.push(`/search?name=${encodeURIComponent(q)}`)} />

      {showWelcome && <WelcomeSlider onClose={() => setShowWelcome(false)} />}

      <div className={styles.page}>
        <section className={styles.gridItem}>
          <PointsBalanceCard />
          <CashbackSummaryCard />
        </section>

        {/* Loading inicial — um único retângulo branco */}
        {isLoadingInitial && (
          <section className={styles.gridItemNoData}>
            <Loading />
          </section>
        )}

        {/* Estado vazio TOTAL (sem categorias e sem empresas) */}
        {showEmptyRegion && (
          <section className={styles.gridItemNoData}>
            <div className={styles.emptyCard}>
              <svg
                className={styles.emptyIllustration}
                viewBox="0 0 200 120"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stopColor="#FFE3B2" />
                    <stop offset="100%" stopColor="#FFD38A" />
                  </linearGradient>
                </defs>
                <rect x="10" y="65" width="180" height="30" rx="6" fill="url(#g1)" />
                <circle cx="60" cy="45" r="18" fill="#FFA600" opacity="0.9" />
                <rect x="90" y="35" width="60" height="12" rx="6" fill="#FFB84D" />
                <rect x="90" y="52" width="48" height="8" rx="4" fill="#FFD08A" />
                <path
                  d="M30 95 Q100 115 170 95"
                  stroke="#FFC56B"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>

              <h5 className={styles.emptyTitle}>Ainda não temos parceiros aqui</h5>
              <p className={styles.emptyText}>
                Mude o endereço para outra região ou, se preferir, indique novos lojistas
                e receba <strong>comissões recorrente</strong>.
              </p>

              <div className={styles.emptyActions}>
                <button
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  onClick={() => window.dispatchEvent(new Event('openAddressModal'))}
                >
                  Trocar de endereço
                </button>

                <Link
                  href="/profile#affiliate"
                  className={`${styles.btn} ${styles.btnGhost} ${styles.exploreMap}`}
                >
                  Indicar empresas e ganhar comissão
                </Link>
              </div>

              <p className={styles.emptyHint}>
                Dica: comece pelos comércios que você já frequenta.
              </p>
            </div>
          </section>
        )}

        {/* CATEGORIAS (independente) */}
        {hasCats && (
          <section className={styles.gridItem}>
            <h4 className={styles.inlineHeader}>Categorias</h4>

            {canLeft && (
              <button
                className={`${styles.arrowButton} ${styles.arrowLeft}`}
                onClick={() => scrollBy(-200)}
                aria-label="Rolagem para a esquerda"
              >
                <ChevronLeft size={20} />
              </button>
            )}

            <div ref={listRef} className={styles.categoriesGrid}>
              {cats.map(cat => (
                <Link key={cat.id} href={`/categories/${cat.id}`} className={styles.card}>
                  <Image
                    src={`${baseUrl}${cat.image_url ?? ''}`}
                    alt={cat.name}
                    width={30}
                    height={30}
                    className={styles.logo}
                  />
                  <span className={styles.name}>{cat.name}</span>
                </Link>
              ))}
            </div>

            {canRight && (
              <button
                className={`${styles.arrowButton} ${styles.arrowRight}`}
                onClick={() => scrollBy(200)}
                aria-label="Rolagem para a direita"
              >
                <ChevronRight size={20} />
              </button>
            )}
          </section>
        )}

        {/* EMPRESAS — só mostra se houver empresas (e nunca mostra loading aqui) */}
        {hasCompanies && !isLoadingInitial && (
          <section className={styles.gridItem}>
            <h4>Descubra agora</h4>

            <div className={styles.companiesList}>
              {companies.map(comp => (
                <div key={comp.id} className={styles.companyCard}>
                  <div className={styles.companyInfo}>
                    {comp.logo_url ? (
                      <Image
                        src={`${process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL}${comp.logo_url}`}
                        alt={comp.name}
                        width={60}
                        height={60}
                        className={styles.companyLogo}
                      />
                    ) : (
                      <div className={styles.companyLogo}>
                        {comp.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h5 className={styles.companyName}>{comp.name}</h5>
                      <p className={styles.companyDesc}>{comp.description}</p>
                    </div>
                  </div>
                  <Link href={`/companies/${comp.id}`} className={styles.companyButton}>
                    Ver empresa
                  </Link>
                </div>
              ))}
            </div>

            {page < totalPages && (
              <button
                className={styles.loadMoreBtn}
                onClick={() => setPage(p => p + 1)}
                disabled={loadingCompanies}
              >
                {loadingCompanies ? 'Carregando...' : 'Carregar mais'}
              </button>
            )}
          </section>
        )}
      </div>
    </>
  );
}

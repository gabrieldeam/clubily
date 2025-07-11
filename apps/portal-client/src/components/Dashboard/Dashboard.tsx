// src/app/dashboard/page.tsx
'use client';

import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useRequireAuth } from '@/hooks/useRequireAuth';
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
  const { loading: authLoading } = useRequireAuth();
  const { selectedAddress } = useAddress();

  /* ───────────── state ───────────── */
  // Categorias
  const [cats, setCats] = useState<CategoryRead[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  // Empresas
  const [companies, setCompanies] = useState<CompanyRead[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  // Scroll categorias
  const listRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';

  /* ───────────── effects ───────────── */
  // Buscar categorias
  useEffect(() => {
    if (!selectedAddress) return;
    let alive = true;

    (async () => {
      setLoadingCats(true);
      const city = selectedAddress.city;
      if (!city) {
        if (alive) setCats([]);
        setLoadingCats(false);
        return;
      }
      try {
        const res = await listUsedCategories({ city });
        if (alive) setCats(res.data);
      } catch {
        if (alive) setCats([]);
      } finally {
        if (alive) setLoadingCats(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [selectedAddress]);

  // Buscar empresas
  useEffect(() => {
    if (!selectedAddress) return;
    let alive = true;

    (async () => {
      setLoadingCompanies(true);
      const city = selectedAddress.city;
      if (!city) {
        if (alive) setCompanies([]);
        setLoadingCompanies(false);
        return;
      }
      try {
        const res = await searchCompanies({ city });
        if (alive) setCompanies(res.data.slice(0, 10));
      } catch {
        if (alive) setCompanies([]);
      } finally {
        if (alive) setLoadingCompanies(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [selectedAddress]);

  // Atualizar setas de scroll
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
  }, [cats, updateArrows]);

  const scrollBy = (delta: number) =>
    listRef.current?.scrollBy({ left: delta, behavior: 'smooth' });

  /* ───────────── render helpers ───────────── */
  const isReady = !!selectedAddress && !loadingCats;

  /* ───────────── render ───────────── */
  return (
    <>
      <Header
        onSearch={q =>
          router.push(`/search?name=${encodeURIComponent(q)}`)
        }
      />

      {/* 1) Enquanto autenticação carrega */}
      {authLoading && <p className={styles.message}>Carregando…</p>}

      {/* 2) Sem endereço selecionado ou categorias ainda carregando */}
      {!authLoading && !isReady && (
        <p className={styles.message}>Carregando dados…</p>
      )}

      {/* 3) Sem categorias na cidade */}
      {!authLoading && isReady && cats.length === 0 && (
        <div className={styles.container}>
          <section className={styles.gridItemNoData}>
            <p>
              Infelizmente não temos empresas parceiras na sua região.
            </p>
            <button
              className={styles.changeBtn}
              onClick={() =>
                window.dispatchEvent(new Event('openAddressModal'))
              }
            >
              Trocar de endereço
            </button>
          </section>
        </div>
      )}

      {/* 4) Conteúdo principal */}
      {!authLoading && isReady && cats.length > 0 && (
        <div className={styles.container}>
          <section className={styles.gridItem}>
            <PointsBalanceCard />
            <CashbackSummaryCard />
          </section>

          {/* CATEGORIAS */}
          <section className={styles.gridItem}>
            <h4 className={styles.inlineHeader}>Categorias</h4>

            {canLeft && (
              <button
                className={`${styles.arrowButton} ${styles.arrowLeft}`}
                onClick={() => scrollBy(-200)}
              >
                <ChevronLeft size={20} />
              </button>
            )}

            <div ref={listRef} className={styles.categoriesGrid}>
              {cats.map(cat => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.id}`}
                  className={styles.card}
                >
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
              >
                <ChevronRight size={20} />
              </button>
            )}
          </section>

          {/* EMPRESAS */}
          <section className={styles.gridItem}>
            <h4>Descubra agora</h4>
            {loadingCompanies ? (
              <p>Carregando empresas…</p>
            ) : (
              <div className={styles.companiesList}>
                {companies.map(comp => (
                  <div key={comp.id} className={styles.companyCard}>
                    <div className={styles.companyInfo}>
                      {comp.logo_url ? (
                        <Image
                          src={`${baseUrl}${comp.logo_url}`}
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
                        <h5 className={styles.companyName}>
                          {comp.name}
                        </h5>
                        <p className={styles.companyDesc}>
                          {comp.description}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/companies/${comp.id}`}
                      className={styles.companyButton}
                    >
                      Ver empresa
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}

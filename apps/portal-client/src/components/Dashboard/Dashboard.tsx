// src/app/dashboard/page.tsx
'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Loading from '@/components/Loading/Loading';
import { useSearchParams } from 'next/navigation';
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
  const { selectedAddress, radiusKm } = useAddress();
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  const [cats, setCats] = useState<CategoryRead[]>([]);

  const [companies, setCompanies] = useState<CompanyRead[]>([]);
  const [page, setPage] = useState(1);
  const size = 10;
  const [totalPages, setTotalPages] = useState(1);
  const listRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const searchParams = useSearchParams();
  const initialShow = Boolean(searchParams.get('welcome'));
  const [showWelcome, setShowWelcome] = useState(initialShow);

  useEffect(() => {
    if (!selectedAddress) return;
    let alive = true;
    (async () => { 
      const postal_code = selectedAddress.postal_code;     
      try {
        const res = await listUsedCategories(postal_code, radiusKm);
        if (alive) setCats(res.data);
      } catch {
        if (alive) setCats([]);
      } finally {
      }
    })();
    return () => { alive = false; };
  }, [selectedAddress , radiusKm]);

useEffect(() => {
  if (!selectedAddress) return;
  let alive = true;
  setLoadingCompanies(true);

  (async () => {
    const postal_code = selectedAddress.postal_code;
    try {
      const res = await searchCompanies(postal_code, radiusKm, page, size);
      if (!alive) return;

      setCompanies(prev =>
        page === 1 ? res.data.items : [...prev, ...res.data.items]
      );
      setTotalPages(Math.ceil(res.data.total / res.data.size));
    } catch {
      if (alive) setCompanies([]);
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
  }, [cats, updateArrows]);

  const scrollBy = (delta: number) =>
    listRef.current?.scrollBy({ left: delta, behavior: 'smooth' });

  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';

  return (
    <>
      <Header
        onSearch={q =>
          router.push(`/search?name=${encodeURIComponent(q)}`)
        }
      />
      {showWelcome && (
        <WelcomeSlider onClose={() => setShowWelcome(false)} />
      )}

      <div className={styles.page}>
        <section className={styles.gridItem}>
          <PointsBalanceCard />
          <CashbackSummaryCard />
        </section>

      {cats.length === 0 ? (
        loadingCompanies ? (
          <section className={styles.gridItemNoData}>
            <Loading />
          </section>
        ) : (
          <section className={styles.gridItemNoData}>
            <p>Infelizmente não temos empresas parceiras na sua região.</p>
            <button
              className={styles.changeBtn}
              onClick={() => window.dispatchEvent(new Event('openAddressModal'))}
            >
              Trocar de endereço
            </button>
          </section>
        )
        ) : (
          <>
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
               {/* Botão “Carregar mais” */}
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
          </>
        )}
      </div>
    </>
  );
}

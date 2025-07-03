// src/app/dashboard/page.tsx
'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAddress } from '@/context/AddressContext';
import { listUsedCategories } from '@/services/categoryService';
import { searchCompanies } from '@/services/companyService';
import type { CategoryRead } from '@/types/category';
import type { CompanyRead } from '@/types/company';
import Header from '@/components/Header/Header';
import styles from './Dashboard.module.css';
import CashbackSummaryCard from '@/components/CashbackSummaryCard/CashbackSummaryCard';
import PointsBalanceCard from '@/components/PointsBalanceCard/PointsBalanceCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRequireAuth } from '@/hooks/useRequireAuth';

export default function Dashboard() {
  const router = useRouter();
  const { loading: authLoading } = useRequireAuth();
  const { selectedAddress } = useAddress();

  // 1) Enquanto autenticação carrega
  if (authLoading) return <p>Carregando…</p>;

  // 2) Categorias
  const [cats, setCats] = useState<CategoryRead[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  // 3) Empresas
  const [companies, setCompanies] = useState<CompanyRead[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';

  // 4) Buscar categorias depois que tivermos selectedAddress
  useEffect(() => {
    if (!selectedAddress) return;

    let alive = true;
    (async () => {
      setLoadingCats(true);
      const cityValue = selectedAddress.city; // fixa em city
      if (!cityValue) {
        if (alive) setCats([]);
        setLoadingCats(false);
        return;
      }
      try {
        const res = await listUsedCategories({ city: cityValue });
        if (alive) setCats(res.data);
      } catch {
        if (alive) setCats([]);
      } finally {
        if (alive) setLoadingCats(false);
      }
    })();
    return () => { alive = false; };
  }, [selectedAddress]);

  // 5) Buscar empresas após selectedAddress
  useEffect(() => {
    if (!selectedAddress) return;

    let alive = true;
    (async () => {
      setLoadingCompanies(true);
      const cityValue = selectedAddress.city;
      if (!cityValue) {
        if (alive) setCompanies([]);
        setLoadingCompanies(false);
        return;
      }
      try {
        const res = await searchCompanies({ city: cityValue });
        if (alive) setCompanies(res.data.slice(0, 10));
      } catch {
        if (alive) setCompanies([]);
      } finally {
        if (alive) setLoadingCompanies(false);
      }
    })();
    return () => { alive = false; };
  }, [selectedAddress]);

  // 6) Scroll categorias
  const listRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
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

  const scrollBy = (d: number) =>
    listRef.current?.scrollBy({ left: d, behavior: 'smooth' });

  // 7) Apenas renderizar depois de carregadas categorias e ter endereço
  const ready = !!selectedAddress && !loadingCats;

  if (!ready) {
    return <Header onSearch={q => router.push(`/search?name=${encodeURIComponent(q)}`)} />;
  }

  // 8) Sem categorais: mostrar mensagem e botão para trocar
  if (cats.length === 0) {
    return (
      <>
      <Header onSearch={q => router.push(`/search?name=${encodeURIComponent(q)}`)} />
      <div className={styles.container}>
        <section className={styles.gridItemNoData}>
          <p>Infelizmente não temos empresas parceiras na sua região.</p>
          <button
            className={styles.changeBtn}
            onClick={() => window.dispatchEvent(new Event('openAddressModal'))}
          >
            Trocar de endereço
          </button>
        </section>
      </div>
      </>
    );
  }

  // 9) Render normal com categorias + empresas
  return (
    <>
    <Header onSearch={q => router.push(`/search?name=${encodeURIComponent(q)}`)} />
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
        )}
      </section>
    </div>
    </>
  );
}

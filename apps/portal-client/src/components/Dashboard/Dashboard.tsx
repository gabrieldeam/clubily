// src/app/dashboard/page.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAddress } from '@/context/AddressContext';
import {
  listUsedCategories,
} from '@/services/categoryService';
import {
  searchCompanies,
} from '@/services/companyService';
import type { CategoryRead } from '@/types/category';
import type { CompanyRead } from '@/types/company';
import Header from '@/components/Header/Header';
import styles from './Dashboard.module.css';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { useRequireAuth } from '@/hooks/useRequireAuth';

export default function Dashboard() {
  const router = useRouter();  
  const { loading } = useRequireAuth();

  if (loading) return <p>Carregando…</p>;

  const {
    selectedAddress,
    filterField,
    setFilterField,
  } = useAddress();


  /* ------- abre modal se não houver endereço -------- */
  useEffect(() => {
    if (!selectedAddress) {
      window.dispatchEvent(new Event('openAddressModal'));
    }
  }, [selectedAddress]);

  /* ------------- estados ------------- */
  const [cats, setCats] = useState<CategoryRead[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [companies, setCompanies] = useState<CompanyRead[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  /* scroll categorias */
  const listRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const updateArrows = () => {
    const el = listRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 0);
    setCanRight(el.scrollWidth - el.clientWidth - el.scrollLeft > 0);
  };
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
  }, [cats]);

  const scrollBy = (d: number) =>
    listRef.current?.scrollBy({ left: d, behavior: 'smooth' });

  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';

  /* --------- busca categorias --------- */
  useEffect(() => {
    let mounted = true;
    async function fetchCats() {
      setLoadingCats(true);
      if (!selectedAddress?.[filterField]) {
        mounted && setCats([]);
        setLoadingCats(false);
        return;
      }
      try {
        const params = { [filterField]: selectedAddress[filterField] as string };
        const res = await listUsedCategories(params);
        mounted && setCats(res.data);
      } catch {
        mounted && setCats([]);
      } finally {
        mounted && setLoadingCats(false);
        updateArrows();
      }
    }
    fetchCats();
    return () => { mounted = false; };
  }, [selectedAddress, filterField]);

  /* --------- busca empresas --------- */
  useEffect(() => {
    let mounted = true;
    async function fetchComps() {
      setLoadingCompanies(true);
      if (!selectedAddress?.[filterField]) {
        mounted && setCompanies([]);
        setLoadingCompanies(false);
        return;
      }
      try {
        const params = { [filterField]: selectedAddress[filterField] as string };
        const res   = await searchCompanies(params);
        mounted && setCompanies(res.data.slice(0, 10));
      } catch {
        mounted && setCompanies([]);
      } finally {
        mounted && setLoadingCompanies(false);
      }
    }
    fetchComps();
    return () => { mounted = false; };
  }, [selectedAddress, filterField]);



  /* -------------------------------------------------- */
  const noData =
    !loadingCats &&
    (!selectedAddress || cats.length === 0);

  return (
    <div>
      <Header onSearch={q => router.push(`/search?name=${encodeURIComponent(q)}`)} />

      {/* ---------- MSG sem dados / trocar endereço ---------- */}
      {noData && (
        <section className={styles.gridItem}>
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
      )}

      {/* Renderiza conteúdo somente se há categorias */}
      {selectedAddress && cats.length > 0 && (
        <>
          {/* --------- CATEGORIAS --------- */}
          <section className={styles.gridItem}>
            <h4 className={styles.inlineHeader}>
              Categorias em
              <div className={styles.filterWrapper}>
                <select
                  value={filterField}
                  onChange={e =>
                    setFilterField(e.target.value as any)
                  }
                  className={styles.filterSelect}
                >
                  <option value="city">
                    {filterField === 'city'
                      ? selectedAddress?.city ?? '...'
                      : 'Cidade'}
                  </option>
                  <option value="street">
                    {filterField === 'street'
                      ? selectedAddress?.street ?? '...'
                      : 'Rua'}
                  </option>
                  <option value="postal_code">
                    {filterField === 'postal_code'
                      ? selectedAddress?.postal_code ?? '...'
                      : 'CEP'}
                  </option>
                  <option value="country">
                    {filterField === 'country'
                      ? selectedAddress?.country ?? '...'
                      : 'País'}
                  </option>
                </select>
                <ChevronDown size={16} className={styles.selectIcon} />
              </div>
            </h4>

            {loadingCats && <p>Carregando categorias…</p>}

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

          {/* --------- EMPRESAS + MAPA --------- */}
          <section className={styles.gridItem}>
            <h4>Descubra agora</h4>           

            {loadingCompanies && <p>Carregando empresas…</p>}

            <div className={styles.companiesList}>
              {companies.map(comp => (
                <div key={comp.id} className={styles.companyCard}>
                  <div className={styles.companyInfo}>
                    {comp.logo_url && (
                      <Image
                        src={`${baseUrl}${comp.logo_url}`}
                        alt={comp.name}
                        width={60}
                        height={60}
                        className={styles.companyLogo}
                      />
                    )}
                    <div>
                      <h5 className={styles.companyName}>{comp.name}</h5>
                      <p className={styles.companyDesc}>{comp.description}</p>
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
          </section>
        </>
      )}
    </div>
  );
}

// src/app/dashboard/page.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
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
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRequireAuth } from '@/hooks/useRequireAuth';

export default function Dashboard() {
  const router = useRouter();
  const { loading } = useRequireAuth();
  const { selectedAddress, filterField } = useAddress();

  // 1) Enquanto o hook de autenticação estiver carregando, mostre “Carregando…”
  if (loading) {
    return <p>Carregando…</p>;
  }

  // 2) Estados para categorias/empresas
  const [cats, setCats] = useState<CategoryRead[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [catsLoadedOnce, setCatsLoadedOnce] = useState(false);

  const [companies, setCompanies] = useState<CompanyRead[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  // 3) Buscar categorias APENAS depois que houver selectedAddress
  useEffect(() => {
    // Se selectedAddress ainda for null, não faz nada (ainda não chamamos a API)
    if (!selectedAddress) {
      return;
    }

    let isAlive = true;
    (async () => {
      setLoadingCats(true);

      // Se, mesmo tendo selectedAddress, filterField não existir, devolve array vazio:
      if (!selectedAddress[filterField]) {
        if (isAlive) setCats([]);
        setLoadingCats(false);
        return;
      }

      try {
        const res = await listUsedCategories({
          [filterField]: selectedAddress[filterField] as string,
        });
        if (isAlive) setCats(res.data);
      } catch {
        if (isAlive) setCats([]);
      } finally {
        if (isAlive) setLoadingCats(false);
      }
    })();

    return () => {
      isAlive = false;
    };
  }, [selectedAddress, filterField]);

  // 4) Assim que terminar a primeira vez que loadingCats virar false, marcamos catsLoadedOnce
  useEffect(() => {
    if (!loadingCats && selectedAddress) {
      setCatsLoadedOnce(true);
    }
  }, [loadingCats, selectedAddress]);

  // 5) Buscar empresas depois que houver selectedAddress
  useEffect(() => {
    if (!selectedAddress) {
      return;
    }

    let isAlive = true;
    (async () => {
      setLoadingCompanies(true);

      // Se não houver valor em selectedAddress[filterField], devolve array vazio:
      if (!selectedAddress[filterField]) {
        if (isAlive) setCompanies([]);
        setLoadingCompanies(false);
        return;
      }

      try {
        const res = await searchCompanies({
          [filterField]: selectedAddress[filterField] as string,
        });
        if (isAlive) setCompanies(res.data.slice(0, 10));
      } catch {
        if (isAlive) setCompanies([]);
      } finally {
        if (isAlive) setLoadingCompanies(false);
      }
    })();

    return () => {
      isAlive = false;
    };
  }, [selectedAddress, filterField]);

  // 6) Controle do scroll horizontal nas categorias
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

  // 7) “Pronto para exibir” significa que já temos selectedAddress e já terminou o primeiro fetch de categorias
  const readyToShow = !!selectedAddress && catsLoadedOnce;

  // 8) Se ainda não estiver pronto para exibir (ou seja, selectedAddress for null, OU ainda estamos aguardando a 1ª resposta de categorias),
  //    mostramos apenas o Header. Nem a mensagem de “sem dados” aparece, nem o “Carregando categorias…”.
  if (!readyToShow) {
    return (
      <div>
        <Header onSearch={(q) => router.push(`/search?name=${encodeURIComponent(q)}`)} />
      </div>
    );
  }

  // 9) A partir de agora, sabemos que:
  //    - selectedAddress existe
  //    - catsLoadedOnce === true (já terminou o primeiro fetch de categorias)
  //    Então, ou exibimos “sem dados” (se cats estiver vazio), ou exibimos tudo: lista de categorias + lista de empresas.

  // 10) Se, mesmo após o fetch inicial, o array de categorias estiver vazio, mostramos a seção “sem dados”:
  if (cats.length === 0) {
    return (
      <div>
        <Header onSearch={(q) => router.push(`/search?name=${encodeURIComponent(q)}`)} />

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
    );
  }

  // 11) Se chegamos aqui, significa que cats.length > 0: exibimos então a grid de categorias + lista de empresas.
  return (
    <div>
      <Header onSearch={(q) => router.push(`/search?name=${encodeURIComponent(q)}`)} />

      {/* --------- CATEGORIAS --------- */}
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
          {cats.map((cat) => (
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

      {/* --------- EMPRESAS --------- */}
      <section className={styles.gridItem}>
        <h4>Descubra agora</h4>

        {loadingCompanies && <p>Carregando empresas…</p>}

        {!loadingCompanies && companies.length === 0 && (
          // Se quiser, poderia colocar: <p>Nenhuma empresa encontrada.</p>
          null
        )}

        <div className={styles.companiesList}>
          {companies.map((comp) => (
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
              <Link href={`/companies/${comp.id}`} className={styles.companyButton}>
                Ver empresa
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

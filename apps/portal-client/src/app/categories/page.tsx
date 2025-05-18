// src/app/categories/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link  from 'next/link';
import Image from 'next/image';
import { listUsedCategories } from '@/services/categoryService';
import type { CategoryRead } from '@/types/category';
import { useAddress } from '@/context/AddressContext';
import Header from '@/components/Header/Header';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import styles from './page.module.css';

export default function CategoriesPage() {
  /* ─── login obrigatório ──────────────────────────────── */
  const { loading: authLoading } = useRequireAuth();
  if (authLoading) return null;      

  /* ─── endereço ───────────────────────────────────────── */
  const { selectedAddress, filterField } = useAddress();

  /* abre modal de endereço se não houver nenhum */
  useEffect(() => {
    if (!selectedAddress) {
      window.dispatchEvent(new Event('openAddressModal'));
    }
  }, [selectedAddress]);

  /* ─── categorias ─────────────────────────────────────── */
  const [cats, setCats]     = useState<CategoryRead[]>([]);
  const [dataLoading, setDL] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function fetch() {
      setDL(true);

      if (!selectedAddress?.[filterField]) {
        mounted && setCats([]);
        setDL(false);
        return;
      }

      try {
        const params: Record<string,string> = {
          [filterField]: selectedAddress[filterField] as string,
        };
        const res = await listUsedCategories(params);
        mounted && setCats(res.data);
      } catch {
        mounted && setCats([]);
      } finally {
        mounted && setDL(false);
      }
    }
    fetch();
    return () => { mounted = false; };
  }, [selectedAddress, filterField]);

  /* ─── mensagens de estado ────────────────────────────── */
  if (dataLoading)   return <p className={styles.message}>Carregando categorias…</p>;
  if (!selectedAddress)
    return (
      <p className={styles.message}>
        Selecione um endereço para ver categorias.
      </p>
    );
  if (!cats.length)
    return (
      <p className={styles.message}>
        Nenhuma categoria encontrada para este filtro.
      </p>
    );

  /* ─── renderização normal ────────────────────────────── */
  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';

  return (
    <div className={styles.container}>
      <Header />

      <main className={styles.gridContainer}>
        {cats.map(cat => (
          <div key={cat.id} className={styles.gridItem}>
            <Link href={`/categories/${cat.id}`} className={styles.card}>
              <div>
                <Image
                  src={`${baseUrl}${cat.image_url ?? ''}`}
                  alt={cat.name}
                  width={60}
                  height={60}
                  className={styles.image}
                />
                <span className={styles.name}>{cat.name}</span>
              </div>
              <button className={styles.categories}>Ver tudo</button>
            </Link>
          </div>
        ))}
      </main>
    </div>
  );
}

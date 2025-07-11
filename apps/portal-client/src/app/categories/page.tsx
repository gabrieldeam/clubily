// src/app/categories/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header/Header';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAddress } from '@/context/AddressContext';
import { listUsedCategories } from '@/services/categoryService';
import type { CategoryRead } from '@/types/category';
import styles from './page.module.css';

export default function CategoriesPage() {
  const router = useRouter();

  // always call hooks at top
  const { loading: authLoading } = useRequireAuth();
  const { selectedAddress } = useAddress();

  const [cats, setCats] = useState<CategoryRead[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Prompt address modal when no address
  useEffect(() => {
    if (!selectedAddress) {
      window.dispatchEvent(new Event('openAddressModal'));
    }
  }, [selectedAddress]);

  // Fetch categories when address changes
  useEffect(() => {
    let mounted = true;
    async function fetchCategories() {
      setDataLoading(true);

      if (!selectedAddress?.city) {
        if (mounted) setCats([]);
        setDataLoading(false);
        return;
      }

      try {
        const res = await listUsedCategories({ city: selectedAddress.city });
        if (mounted) setCats(res.data);
      } catch {
        if (mounted) setCats([]);
      } finally {
        if (mounted) setDataLoading(false);
      }
    }

    fetchCategories();
    return () => {
      mounted = false;
    };
  }, [selectedAddress]);

  // render guards after hooks
  if (authLoading) {
    return null;
  }

  if (dataLoading) {
    return <p className={styles.message}>Carregando categorias…</p>;
  }

  if (!selectedAddress) {
    return (
      <p className={styles.message}>
        Selecione um endereço para ver categorias.
      </p>
    );
  }

  if (cats.length === 0) {
    return (
      <p className={styles.message}>
        Nenhuma categoria encontrada para este filtro.
      </p>
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';

  return (
    <>
      <Header onSearch={q => router.push(`/search?name=${encodeURIComponent(q)}`)} />
      <div className={styles.container}>
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
                <button className={styles.categories}>
                  Ver tudo
                </button>
              </Link>
            </div>
          ))}
        </main>
      </div>
    </>
  );
}

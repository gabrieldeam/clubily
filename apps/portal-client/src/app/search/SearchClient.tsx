// src/app/search/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { searchCompaniesByName } from '@/services/companyService';
import type { CompanyReadWithService } from '@/types/company';
import { useAddress } from '@/context/AddressContext';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header/Header';
import styles from './page.module.css';

export default function SearchClient() {
  const router = useRouter();
  const params = useSearchParams();
  const name = params.get('name')?.trim() ?? '';
  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';

  // 1) vamos puxar o radiusKm também
  const { selectedAddress, radiusKm } = useAddress();

  const [companies, setCompanies] = useState<CompanyReadWithService[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const [page, setPage] = useState(1);
const size = 10;
const [totalPages, setTotalPages] = useState(1);

useEffect(() => {
  if (!name) return;
  if (!selectedAddress) {
    window.dispatchEvent(new Event('openAddressModal'));
    return;
  }

  let mounted = true;
  setLoading(true);
  setError(null);

  searchCompaniesByName(
    name,
    selectedAddress.postal_code,
    radiusKm,
    page,
    size
  )
    .then(res => {
      if (!mounted) return;
      // na página 1: substitui; caso contrário concatena
      setCompanies(prev =>
        page === 1 ? res.data.items : [...prev, ...res.data.items]
      );
      setTotalPages(Math.ceil(res.data.total / res.data.size));
    })
    .catch(() => {
      if (mounted) setError('Erro ao buscar empresas.');
    })
    .finally(() => {
      if (mounted) setLoading(false);
    });

  return () => {
    mounted = false;
  };
}, [name, selectedAddress, radiusKm, page]);


  return (
    <>
      <Header
        onSearch={q => router.push(`/search?name=${encodeURIComponent(q)}`)}
      />

      <main className={styles.main}>
        {error && <p className={styles.error}>{error}</p>}

        {!error && (
          <>
            {companies.length === 0 && !loading && (
              <p className={styles.message}>
                Nenhuma empresa encontrada para “{name}”.
              </p>
            )}

            {loading && <p>Carregando resultados…</p>}

            <ul className={styles.list}>
              {companies.map(c => (
                <li key={c.id}>
                  <Link href={`/companies/${c.id}`} className={styles.item}>
                    <div className={styles.companyInfo}>
                      {c.logo_url && (
                        <Image
                          src={`${baseUrl}${c.logo_url}`}
                          alt={c.name}
                          width={60}
                          height={60}
                          className={styles.logo}
                        />
                      )}
                      <div>
                        <h2 className={styles.name}>{c.name}</h2>
                        {c.description && (
                          <p className={styles.desc}>{c.description}</p>
                        )}
                      </div>
                    </div>

                    <span className={styles.tag}>
                      {c.serves_address
                        ? 'Atende seu endereço'
                        : 'Não atende seu endereço'}
                    </span>
                  </Link>
                </li>
              ))}              
            </ul>
            {page < totalPages && (
                <button
                  className={styles.loadMoreBtn}
                  onClick={() => setPage(p => p + 1)}
                  disabled={loading}
                >
                  {loading ? 'Carregando...' : 'Carregar mais'}
                </button>
              )}
          </>
        )}
      </main>
    </>
  );
}

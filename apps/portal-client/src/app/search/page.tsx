'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header/Header';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAddress } from '@/context/AddressContext';
import { searchCompaniesByName } from '@/services/companyService';
import type { CompanyReadWithService } from '@/types/company';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';

export default function SearchResultsPage() {
  const router = useRouter();
  const { loading: authLoading } = useRequireAuth();
  const { selectedAddress } = useAddress();
  const params = useSearchParams();
  const name = params.get('name')?.trim() ?? '';
  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';

  const [companies, setCompanies] = useState<CompanyReadWithService[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dispara a busca sempre que muda `name` ou `selectedAddress`
  useEffect(() => {
  if (!name) return;
  if (!selectedAddress) {
    window.dispatchEvent(new Event('openAddressModal'));
    return;
  }
  setLoading(true);
  setError(null);

  searchCompaniesByName(name, {
    city: selectedAddress.city,
    street: selectedAddress.street,
    postal_code: selectedAddress.postal_code,
  })
    .then(res => setCompanies(res.data))
    .catch(() => setError('Erro ao buscar empresas.'))
    .finally(() => setLoading(false));
}, [name, selectedAddress]);


  if (authLoading) return null;

  return (
    <div className={styles.container}>
      {/* Faz o Header redirecionar à própria página de busca */}
      <Header onSearch={q => router.push(`/search?name=${encodeURIComponent(q)}`)} />

      <main className={styles.main}>
        <h3>Resultados para “{name}”</h3>

        {loading && <p>Carregando resultados…</p>}
        {error && <p className={styles.error}>{error}</p>}
        {!loading && !error && companies.length === 0 && (
          <p className={styles.message}>Nenhuma empresa encontrada.</p>
        )}

        <ul className={styles.list}>
          {companies.map(c => (
            <li key={c.id} >
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
                    {c.description && <p className={styles.desc}>{c.description}</p>}
                  </div>
                </div>            
                  
                <span className={styles.tag}>
                  {c.serves_address ? 'Atende seu endereço' : 'Não atende seu endereço'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}

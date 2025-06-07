// src/app/affiliate/[code]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header/Header';
import { getCompaniesByReferralCode } from '@/services/companyService';
import type { CompanyRead } from '@/types/company';
import styles from './page.module.css';

export default function AffiliatePage() {
  const { code } = useParams() as { code: string };
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';

  useEffect(() => {
    if (!code) return;
    getCompaniesByReferralCode(code)
      .then(res => setCompanies(res.data))
      .catch(() => setError('Não foi possível carregar as empresas.'))
      .finally(() => setLoading(false));
  }, [code]);

  return (
    <>
      <Header onSearch={q => router.push(`/search?name=${encodeURIComponent(q)}`)} />

      <div className={styles.gridItem}>
        <h2 className={styles.name}>Empresas indicadas por “{code}”</h2>
        <Link href="/" className={styles.categories}>Voltar</Link>
      </div>

      <section className={styles.gridItemMap}>
        {loading && <p className={styles.loading}>Carregando empresas…</p>}
        {error && <p className={styles.loading}>{error}</p>}

        {!loading && !error && (
          companies.length > 0 ? (
            <div className={styles.companiesList}>
              {companies.map(comp => (
                <div key={comp.id} className={styles.companyCard}>
                  <div className={styles.companyInfo}>
                    {comp.logo_url && (
                      <Image
                        src={`${baseUrl}${comp.logo_url}`}
                        alt={comp.name}
                        width={80}
                        height={80}
                        className={styles.companyLogo}
                      />
                    )}
                    <div>
                      <h5 className={styles.companyName}>{comp.name}</h5>
                      {comp.description && <p className={styles.companyDesc}>{comp.description}</p>}
                    </div>
                  </div>
                  <Link href={`/companies/${comp.id}`} className={styles.companyButton}>
                    Ver empresa
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.loading}>Nenhuma empresa encontrada para este código.</p>
          )
        )}
      </section>
    </>
  );
}

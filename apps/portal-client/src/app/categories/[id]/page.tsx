// src/app/categories/[id]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header/Header';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAddress } from '@/context/AddressContext';
import { listCategories } from '@/services/categoryService';
import { searchCompaniesByCategory } from '@/services/companyService';
import type { CategoryRead } from '@/types/category';
import type { CompanyRead } from '@/types/company';
import styles from './page.module.css';

export default function CategoryPage() {
  const router = useRouter();
  const { loading: authLoading } = useRequireAuth();
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  // agora pegamos também o radiusKm
  const { selectedAddress, radiusKm } = useAddress();

  const [cat, setCat] = useState<CategoryRead | null>(null);
  const [loadingCat, setLoadingCat] = useState(true);

  const [companies, setCompanies] = useState<CompanyRead[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';

  // open modal se não tiver endereço
  useEffect(() => {
    if (!selectedAddress) {
      window.dispatchEvent(new Event('openAddressModal'));
    }
  }, [selectedAddress]);

  // carregar a categoria atual
  useEffect(() => {
    if (!id) return;
    setLoadingCat(true);
    listCategories()
      .then(res => res.data.find(c => c.id === id) ?? null)
      .then(found => setCat(found))
      .catch(() => setCat(null))
      .finally(() => setLoadingCat(false));
  }, [id]);

  // buscar empresas por categoria, postal_code e raio
  useEffect(() => {
    let mounted = true;
    async function fetchCompanies() {
      setLoadingCompanies(true);

      // se faltar id, endereço ou postal_code, limpa
      if (
        !id ||
        !selectedAddress ||
        !selectedAddress.postal_code
      ) {
        if (mounted) setCompanies([]);
        setLoadingCompanies(false);
        return;
      }

      try {
        // passa categoryId, postal_code e radiusKm
        const res = await searchCompaniesByCategory(
          id,
          selectedAddress.postal_code,
          radiusKm
        );
        if (mounted) setCompanies(res.data.slice(0, 10));
      } catch {
        if (mounted) setCompanies([]);
      } finally {
        if (mounted) setLoadingCompanies(false);
      }
    }

    fetchCompanies();
    // re-executa quando mudar category id, endereço ou raio
    return () => { mounted = false; };
  }, [id, selectedAddress, radiusKm]);

  if (authLoading) return null;
  if (loadingCat) return <p>Carregando...</p>;
  if (!cat) return <p>Categoria não encontrada.</p>;

  return (
    <>
      <Header onSearch={q => router.push(`/search?name=${encodeURIComponent(q)}`)} />
      <div className={styles.container}>
        {/* Category Header */}
        <div className={styles.gridItem}>
          <div>
            <Image
              src={`${baseUrl}${cat.image_url ?? ''}`}
              alt={cat.name}
              width={60}
              height={60}
              className={styles.image}
            />
            <h2 className={styles.name}>{cat.name}</h2>
          </div>
          <Link href="/categories" className={styles.categories}>
            <button>← Voltar a Categorias</button>
          </Link>
        </div>

        {/* Companies Section */}
        <section className={styles.gridItemMap}>
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
                        width={40}
                        height={40}
                        className={styles.companyLogo}
                      />
                    ) : (
                      <div className={styles.companyLogoFallback}>
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

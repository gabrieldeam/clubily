// src/app/categories/[id]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAddress } from '@/context/AddressContext';
import Header from '@/components/Header/Header';
import { listCategories } from '@/services/categoryService';
import type { CategoryRead } from '@/types/category';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import type { CompanyRead } from '@/types/company';
import styles from './page.module.css';
import {
  MapContainer,
  TileLayer,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import {
  searchCompaniesByCategory,
} from '@/services/companyService';

// corrige ícone padrão Leaflet no Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

export default function CategoryPage() {
  const router = useRouter();  
  // 1. Hooks sempre chamados na mesma ordem
  const { loading: authLoading } = useRequireAuth();
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [cat, setCat] = useState<CategoryRead | null>(null);
  const [loading, setLoading] = useState(true);
    const [companies, setCompanies] = useState<CompanyRead[]>([]);

  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';
    const [loadingCompanies, setLoadingCompanies] = useState(true);

    /* mapa */
    const [coords, setCoords] = useState<[number, number] | null>(null);

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

  // 2. Fetch dos dados
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    listCategories()
      .then(res => res.data.find(c => c.id === id) ?? null)
      .then(found => setCat(found))
      .catch(() => setCat(null))
      .finally(() => setLoading(false));
  }, [id]);

useEffect(() => {
  if (!id) return;
  if (!selectedAddress) {
    setCompanies([]);
    setLoadingCompanies(false);
    return;
  }

  let mounted = true;
  async function fetchComps() {
    setLoadingCompanies(true);

    // pega o valor dinamicamente e confirma que é string
    const raw = (selectedAddress as any)[filterField];
    const value = typeof raw === 'string' ? raw : '';

    if (!value) {
      if (mounted) setCompanies([]);
      setLoadingCompanies(false);
      return;
    }

    try {
      // usamos `any` aqui para não ter conflito de tipos
      const filters: any = {};
      filters[filterField] = value;

      const res = await searchCompaniesByCategory(id!, filters);
      if (mounted) setCompanies(res.data.slice(0, 10));
    } catch {
      if (mounted) setCompanies([]);
    } finally {
      if (mounted) setLoadingCompanies(false);
    }
  }

  fetchComps();
  return () => { mounted = false; };
}, [id, selectedAddress, filterField]);





    /* --------- geocode para mapa --------- */
      useEffect(() => {
        if (!selectedAddress) return;
        const q = `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state}, ${selectedAddress.postal_code}`;
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`)
          .then(r => r.json())
          .then((d:any[]) => d[0]
            ? setCoords([+d[0].lat, +d[0].lon])
            : setCoords(null))
          .catch(() => setCoords(null));
      }, [selectedAddress]);

  // 3. Early returns após todos os hooks
  if (authLoading) return null;
  if (loading)     return <p>Carregando...</p>;
  if (!cat)        return <p>Categoria não encontrada.</p>;

  // 4. Render
  return (
    <div>
      <Header onSearch={q => router.push(`/search?name=${encodeURIComponent(q)}`)} />

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
          Categorias
        </Link>
      </div>


      <section className={styles.gridItemMap}>
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
                        width={40}
                        height={40}
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

    </div>
  );
}

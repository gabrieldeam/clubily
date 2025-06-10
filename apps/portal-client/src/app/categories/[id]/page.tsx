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
import { MapContainer, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Corrige ícone padrão Leaflet no Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

export default function CategoryPage() {
  const router = useRouter();
  const { loading: authLoading } = useRequireAuth();
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const { selectedAddress } = useAddress();

  const [cat, setCat] = useState<CategoryRead | null>(null);
  const [loadingCat, setLoadingCat] = useState(true);

  const [companies, setCompanies] = useState<CompanyRead[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  const [coords, setCoords] = useState<[number, number] | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';

  // Abre modal de endereço se não houver
  useEffect(() => {
    if (!selectedAddress) {
      window.dispatchEvent(new Event('openAddressModal'));
    }
  }, [selectedAddress]);

  // Fetch categoria
  useEffect(() => {
    if (!id) return;
    setLoadingCat(true);
    listCategories()
      .then(res => res.data.find(c => c.id === id) ?? null)
      .then(found => setCat(found))
      .catch(() => setCat(null))
      .finally(() => setLoadingCat(false));
  }, [id]);

  // Fetch empresas por categoria + cidade do endereço
  useEffect(() => {
    if (!id || !selectedAddress) {
      setCompanies([]);
      setLoadingCompanies(false);
      return;
    }

    let mounted = true;
    const fetchComps = async () => {
      setLoadingCompanies(true);
      const city = selectedAddress.city;
      if (!city) {
        if (mounted) setCompanies([]);
        setLoadingCompanies(false);
        return;
      }
      try {
        const filters = { city };
        const res = await searchCompaniesByCategory(id, filters);
        if (mounted) setCompanies(res.data.slice(0, 10));
      } catch {
        if (mounted) setCompanies([]);
      } finally {
        if (mounted) setLoadingCompanies(false);
      }
    };
    fetchComps();
    return () => { mounted = false; };
  }, [id, selectedAddress]);

  // Geocode para mapa
  useEffect(() => {
    if (!selectedAddress) return;
    const query = `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state}, ${selectedAddress.postal_code}`;
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then((data: any[]) => {
        if (data[0]) setCoords([+data[0].lat, +data[0].lon]);
        else setCoords(null);
      })
      .catch(() => setCoords(null));
  }, [selectedAddress]);

  if (authLoading) return null;
  if (loadingCat) return <p>Carregando...</p>;
  if (!cat) return <p>Categoria não encontrada.</p>;

  return (
    <div>
      <Header onSearch={q => router.push(`/search?name=${encodeURIComponent(q)}`)} />

      {/* Cabeçalho da categoria */}
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
        <Link href="/categories" className={styles.categories}>Categorias</Link>
      </div>

      {/* Seção de empresas */}
      <section className={styles.gridItemMap}>
        <h4>Descubra agora</h4>

        {loadingCompanies && <p>Carregando empresas…</p>}

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
      </section>
    </div>
  );
}

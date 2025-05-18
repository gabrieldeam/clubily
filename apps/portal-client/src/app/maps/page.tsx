// src/app/maps/page.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAddress } from '@/context/AddressContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import {
  searchCompanies,
  searchCompaniesByCategory,
} from '@/services/companyService';
import { listUsedCategories } from '@/services/categoryService';
import type { CompanyRead } from '@/types/company';
import type { CategoryRead } from '@/types/category';
import Header from '@/components/Header/Header';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './page.module.css';
import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { distanceInMeters } from '@/utils/haversine';

// Corrige paths dos ícones Leaflet no Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

interface Coords { lat: number; lon: number; }

/** dispara callback se o usuário mover o mapa para fora de um raio */
function DistanceWatcher({
  origin,
  threshold = 20_000,
  onOutside,
}: {
  origin: [number, number];
  threshold?: number;
  onOutside: () => void;
}) {
  const map = useMap();
  useEffect(() => {
    function check() {
      const center = map.getCenter();
      const dist = distanceInMeters(origin, [center.lat, center.lng]);
      if (dist > threshold) onOutside();
    }
    map.on('moveend', check);
    return () => { map.off('moveend', check); };
  }, [map, origin, threshold, onOutside]);
  return null;
}

export default function MapsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get('category_id');

  // exige login
  const { loading: authLoading } = useRequireAuth();
  if (authLoading) return null;

  const { selectedAddress } = useAddress();
  // abre modal se não houver endereço
  useEffect(() => {
    if (!selectedAddress) {
      window.dispatchEvent(new Event('openAddressModal'));
    }
  }, [selectedAddress]);

  // --- estados ---
  const [cats, setCats] = useState<CategoryRead[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  const [userCoords, setUserCoords] = useState<Coords | null>(null);
  const [companies, setCompanies] = useState<CompanyRead[]>([]);
  const [compPos, setCompPos] = useState<Record<string, Coords>>({});
  const [loadingComps, setLoadingComps] = useState(true);
  const [outside, setOutside] = useState(false);

  // scroll das categorias
  const listRef = useRef<HTMLDivElement>(null);
  const [canL, setCanL] = useState(false);
  const [canR, setCanR] = useState(false);
  const updateScroll = () => {
    const el = listRef.current;
    if (!el) return;
    setCanL(el.scrollLeft > 0);
    setCanR(el.scrollWidth - el.clientWidth - el.scrollLeft > 0);
  };
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScroll);
    window.addEventListener('resize', updateScroll);
    updateScroll();
    return () => {
      el.removeEventListener('scroll', updateScroll);
      window.removeEventListener('resize', updateScroll);
    };
  }, [cats]);

  const scrollBy = (d: number) =>
    listRef.current?.scrollBy({ left: d, behavior: 'smooth' });

  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';

  // --- carrega categorias usadas na cidade do usuário ---
  useEffect(() => {
    if (!selectedAddress) return;
    setLoadingCats(true);
    listUsedCategories({ city: selectedAddress.city })
      .then(r => setCats(r.data))
      .finally(() => { setLoadingCats(false); updateScroll(); });
  }, [selectedAddress]);

  // --- geocode do usuário ---
  useEffect(() => {
    if (!selectedAddress) return;
    const q = `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state}, ${selectedAddress.postal_code}`;
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`)
      .then(r => r.json())
      .then((d: any[]) => {
        if (d[0]) setUserCoords({ lat: +d[0].lat, lon: +d[0].lon });
        else setUserCoords(null);
      })
      .catch(() => setUserCoords(null));
  }, [selectedAddress]);

  // --- carrega empresas (filtra por categoria se existir) ---
  useEffect(() => {
    if (!selectedAddress) {
      setLoadingComps(false);
      return;
    }
    setLoadingComps(true);
    const filters = { city: selectedAddress.city };
    const fetcher = categoryId
      ? () => searchCompaniesByCategory(categoryId, filters)
      : () => searchCompanies(filters);

    fetcher()
      .then(r => {
        setCompanies(r.data.slice(0, 10));
        // geocode de cada empresa
        r.data.forEach(c => {
          const q = `${c.street}, ${c.city}, ${c.state}, ${c.postal_code}`;
          fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`)
            .then(rr => rr.json())
            .then((d: any[]) => {
              if (d[0]) {
                setCompPos(prev => ({
                  ...prev,
                  [c.id]: { lat: +d[0].lat, lon: +d[0].lon },
                }));
              }
            })
            .catch(() => {});
        });
      })
      .catch(() => setCompanies([]))
      .finally(() => setLoadingComps(false));
  }, [selectedAddress, categoryId]);

  // --- ícone customizado circular ---
  const makeIcon = (url: string) =>
    new L.Icon({
      iconUrl: `${baseUrl}${url}`,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      className: styles.companyMarker,
    });

  // --- guards de renderização ---
  if (!selectedAddress) {
    return <p className={styles.message}>Selecione um endereço para ver o mapa.</p>;
  }
  if (!userCoords) {
    return <p className={styles.message}>Carregando localização…</p>;
  }

  return (
    <div className={styles.container}>
      <Header />

      {outside && (
        <button
          className={styles.outsideBanner}
          onClick={() => {
            setOutside(false);
            window.dispatchEvent(new Event('openAddressModal'));
          }}
        >
          Você saiu da área – clique para mudar de endereço
        </button>
      )}

      {/* MAPA */}
      <div className={styles.mapWrapper}>
        <MapContainer
          center={[userCoords.lat, userCoords.lon]}
          zoom={13}
          zoomControl={false}
          attributionControl={false}
          className={styles.mapContainer}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          <DistanceWatcher
            origin={[userCoords.lat, userCoords.lon]}
            threshold={20_000}
            onOutside={() => setOutside(true)}
          />

          <Marker position={[userCoords.lat, userCoords.lon]}>
            <Popup>Você está aqui</Popup>
          </Marker>

          {!loadingComps &&
            companies.map(c => {
              const pos = compPos[c.id];
              if (!pos) return null;
              return (
                <Marker
                  key={c.id}
                  position={[pos.lat, pos.lon]}
                  icon={makeIcon(c.logo_url || '')}
                >
                  <Popup>
                    <strong>{c.name}</strong><br />
                    {c.street}, {c.city}<br />
                    <button
                      className={styles.popupBtn}
                      onClick={() => router.push(`/companies/${c.id}`)}
                    >
                      Ver empresa
                    </button>
                  </Popup>
                </Marker>
              );
            })}
        </MapContainer>

        {/* overlay das empresas */}
        <div className={styles.companiesOverlay}>
          {companies.map(c => (
            <div key={c.id} className={styles.companyItem}>
              <div className={styles.companyInfo}>
                {c.logo_url && (
                  <Image
                    src={`${baseUrl}${c.logo_url}`}
                    alt={c.name}
                    width={70}
                    height={70}
                    className={styles.companyLogo}
                  />
                )}
                <div>
                  <h5 className={styles.companyName}>{c.name}</h5>
                  <p className={styles.companyDesc}>{c.description}</p>
                </div>
              </div>
              <Link href={`/companies/${c.id}`} className={styles.companyButton}>
                Ver empresa
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* CATEGORIAS */}
      <section className={styles.gridItem}>
        <h4>Categorias</h4>

        {loadingCats && <p>Carregando categorias…</p>}
        {!loadingCats && !cats.length && <p>Nenhuma categoria encontrada.</p>}

        {canL && (
          <button
            className={`${styles.arrowButton} ${styles.arrowLeft}`}
            onClick={() => scrollBy(-200)}
          >
            <ChevronLeft size={20} />
          </button>
        )}

        <div ref={listRef} className={styles.categoriesGrid}>
          {cats.map(cat => (
            <div
              key={cat.id}
              className={styles.card}
              onClick={() =>
                router.push(`/maps?category_id=${cat.id}`)
              }
            >
              <Image
                src={`${baseUrl}${cat.image_url ?? ''}`}
                alt={cat.name}
                width={40}
                height={40}
                className={styles.logo}
              />
              <span className={styles.name}>{cat.name}</span>
            </div>
          ))}
        </div>

        {canR && (
          <button
            className={`${styles.arrowButton} ${styles.arrowRight}`}
            onClick={() => scrollBy(200)}
          >
            <ChevronRight size={20} />
          </button>
        )}
      </section>
    </div>
  );
}

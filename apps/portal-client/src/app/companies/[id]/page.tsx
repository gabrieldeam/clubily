// src/app/companies/[id]/page.tsx
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { getCompanyInfo } from '@/services/companyService';
import type { CompanyRead } from '@/types/company';
import Header from '@/components/Header/Header';
import styles from './page.module.css';

const MapContainer = dynamic(
  () => import('react-leaflet').then(mod => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then(mod => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then(mod => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then(mod => mod.Popup),
  { ssr: false }
);

export default function CompanyPage() {
  // autenticação e roteamento
  const { loading: authLoading } = useRequireAuth();
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  // estados
  const [company, setCompany] = useState<CompanyRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';

  // fetch dos dados da empresa
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getCompanyInfo(id)
      .then(res => setCompany(res.data))
      .catch(err => {
        console.error(err);
        setError('Não foi possível carregar os dados da empresa.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  // geocoding do endereço (via Nominatim)
  useEffect(() => {
    if (!company) return;
    const address = `${company.street}, ${company.city}, ${company.state}, ${company.postal_code}`;
    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address
      )}`
    )
      .then(res => res.json())
      .then((data: any[]) => {
        if (data.length > 0) {
          setCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        }
      })
      .catch(err => console.error(err));
  }, [company]);

  useEffect(() => {
  if (company !== null && company.is_active === false) {
    setShowBanner(true);
  }
}, [company]);

  const logoIcon = useMemo(() => {
    if (!company?.logo_url) return undefined;
    return new L.DivIcon({
      html: `
        <div class="${styles.logoMarker}">
          <img src="${baseUrl}${company.logo_url}" alt="${company.name}" />
        </div>
      `,
      iconSize: [50, 50],
      iconAnchor: [25, 50],
      className: ''
    });
  }, [company, baseUrl]);

  // Early returns
  if (authLoading) return null;

  if (loading) {
    return (
      <section className={styles.container}>
        <Header />
        <p className={styles.message}>Carregando dados da empresa…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.container}>
        <Header />
        <p className={styles.error}>{error}</p>
        <button onClick={() => router.back()} className={styles.backBtn}>
          ← Voltar
        </button>
      </section>
    );
  }

  if (!company) {
    return (
      <div>
        <Header
          onSearch={q =>
            router.push(`/search?name=${encodeURIComponent(q)}`)
          }
        />
        <section className={styles.detail}>
          <p className={styles.message}>Empresa não encontrada.</p>
        </section>
      </div>
    );
  }

  const addressText = `${company.street}, ${company.city} – ${company.state}, ${company.postal_code}`;

  // Render principal
  return (
    <div>
      <Header
        onSearch={q =>
          router.push(`/search?name=${encodeURIComponent(q)}`)
        }
      />

      {showBanner && (
        <button
          className={styles.outsideBanner}
          onClick={() => {
            setShowBanner(false);
            window.dispatchEvent(new Event('openAddressModal'));
          }}
        >
          Essa empresa não atente sua área – clique para mudar de endereço
        </button>
      )}

      <div
        className={`
          ${styles.detail}
          ${!company.is_active ? styles.inactive : ''}
        `}
      >
        <div className={styles.companyCard}>
          <div className={styles.companyInfo}>
            {company.logo_url && (
              <Image
                src={`${baseUrl}${company.logo_url}`}
                alt={company.name}
                width={120}
                height={120}
                className={styles.companyLogo}
              />
            )}

            <div>
              <h1 className={styles.name}>{company.name}</h1>
              {company.description && (
                <p className={styles.description}>
                  {company.description}
                </p>
              )}
            </div>
          </div>

          <div className={styles.companyButton}>
            {company.categories.map((cat, i) => (
              <React.Fragment key={cat.id}>
                <Link
                  href={`/categories/${cat.id}`}
                  className={styles.categoryLink}
                >
                  {cat.name}
                </Link>
                {i < company.categories.length - 1 && ', '}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className={styles.infoGrid}>
            <h4>Endereço</h4>
          <div className={styles.mapContainer}>
            {coords ? (
              <MapContainer
                center={coords}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={coords} icon={logoIcon}>
                  <Popup>{addressText}</Popup>
                </Marker>
              </MapContainer>
            ) : (
              <p>Carregando mapa…</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

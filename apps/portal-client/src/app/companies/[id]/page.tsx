// src/app/companies/[id]/page.tsx
'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { getCompanyInfo } from '@/services/companyService';
import type { CompanyRead } from '@/types/company';
import Header from '@/components/Header/Header';
import styles from './page.module.css';

// Corrige ícone padrão do Leaflet no Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl:       '/leaflet/marker-icon.png',
  shadowUrl:     '/leaflet/marker-shadow.png',
});

// Dynamic imports para SSR off
const MapContainer = dynamic(
  () => import('react-leaflet').then(m => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then(m => m.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then(m => m.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then(m => m.Popup),
  { ssr: false }
);

// Fallback HTML para o ícone quando não houver logo
const FALLBACK_ICON_HTML = `
  <div style="
    background-color: #FFA600;
    width: 50px;
    height: 50px;
    border-radius: 25px;
    border: 2px solid #FFF;
  "></div>
`;

export default function CompanyPage() {
  const { loading: authLoading } = useRequireAuth();
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [company, setCompany] = useState<CompanyRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';

  // 1) Fetch empresa
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getCompanyInfo(id)
      .then(res => setCompany(res.data))
      .catch(() => setError('Não foi possível carregar os dados da empresa.'))
      .finally(() => setLoading(false));
  }, [id]);

  // 2) Geocode
  useEffect(() => {
    if (!company) return;
    const addr = `${company.street}, ${company.city}, ${company.state}, ${company.postal_code}`;
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}`)
      .then(res => res.json())
      .then((data: any[]) => {
        if (data.length) {
          setCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        }
      })
      .catch(console.error);
  }, [company]);

  // 3) Banner inativo
  useEffect(() => {
    if (company && !company.is_active) {
      setShowBanner(true);
    }
  }, [company]);

  // 4) Ícone – usa logo ou fallback
  const logoIcon = useMemo(() => {
    const html = company?.logo_url
      ? `<div class="${styles.logoMarker}">
           <img src="${baseUrl}${company.logo_url}"
                alt="${company.name}"
                style="width:100%;height:100%;border-radius:50%;" />
         </div>`
      : FALLBACK_ICON_HTML;
    return new L.DivIcon({
      html,
      iconSize:   [50, 50],
      iconAnchor: [25, 50],
      className:  '',
    });
  }, [company, baseUrl]);

  // 5) Abrir Google Maps
  const handleOpenMap = useCallback(() => {
    if (!company) return;
    const query = coords
      ? `${coords[0]},${coords[1]}`
      : encodeURIComponent(`${company.street}, ${company.city}, ${company.state}, ${company.postal_code}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  }, [company, coords]);

  const addressExists =
    !!company?.street &&
    !!company?.city &&
    !!company?.state &&
    !!company?.postal_code;

  // 6) Skeletons e erros
  if (authLoading) return null;
  if (loading)
    return (
      <section className={styles.container}>
        <Header />
        <p className={styles.message}>Carregando dados…</p>
      </section>
    );
  if (error)
    return (
      <section className={styles.container}>
        <Header />
        <p className={styles.error}>{error}</p>
      </section>
    );
  if (!company)
    return (
      <section className={styles.container}>
        <Header />
        <p className={styles.message}>Empresa não encontrada.</p>
      </section>
    );

  // 7) Render final
  return (
    <div className={styles.pageWrapper}>
      <Header onSearch={q => router.push(`/search?name=${encodeURIComponent(q)}`)} />

      {showBanner && (
        <div className={styles.whiteBoxAlert}>
          <button
            className={styles.outsideBanner}
            onClick={() => {
              setShowBanner(false);
              window.dispatchEvent(new Event('openAddressModal'));
            }}
          >
            Essa empresa está desativada ou não atende mais na sua área,
            clique aqui para mudar de endereço
          </button>
        </div>
      )}

      <div className={`${styles.whiteBox} ${!company.is_active ? styles.inactive : ''}`}>
        <div className={styles.infoMapSection}>
          <div className={styles.infoColumn}>
            <Image
              src={company.logo_url ? `${baseUrl}${company.logo_url}` : '/placeholder-80.png'}
              alt={company.name}
              width={80}
              height={80}
              className={styles.logo}
            />
            <div className={styles.textContainer}>
              <h1 className={styles.name}>{company.name}</h1>
              {company.description && (
                <p className={styles.description}>{company.description}</p>
              )}
              {company.only_online && company.online_url && (
                <p className={styles.onlineLink}>
                  <a href={company.online_url} target="_blank" rel="noopener">
                    Visitar site
                  </a>
                </p>
              )}
            </div>
          </div>

          {company.categories.length > 0 && (() => {
            const firstCat = company.categories[0];
            const imageUri = firstCat.image_url
              ? `${baseUrl}${firstCat.image_url}`
              : `${baseUrl}/placeholder.svg`;
            return (
              <Link href={`/categories/${firstCat.id}`} className={styles.categoryIconWrapper}>
                <img src={imageUri} alt={firstCat.name} className={styles.categoryIcon} />
                {company.categories.length > 1 && (
                  <span className={styles.categoryCountBadge}>
                    {company.categories.length}
                  </span>
                )}
              </Link>
            );
          })()}
        </div>

        {!company.only_online && addressExists && coords && (
          <>
            <h2 className={styles.sectionTitle}>Localização</h2>
            <div className={styles.leafletWrapper}>
              <MapContainer center={coords} zoom={16} style={{ width: '100%', height: '200px' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={coords} icon={logoIcon}>
                  <Popup>
                    <div className={styles.popupContent}>
                      <strong>{company.name}</strong>
                      <p>
                        {company.street}, {company.city} &ndash; {company.state},{' '}
                        {company.postal_code}
                      </p>
                      <button
                        type="button"
                        className={styles.mapButton}
                        onClick={handleOpenMap}
                      >
                        Abrir no Google Maps
                      </button>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </>
        )}
      </div>

      {/* CONTATO */}
      <div className={styles.whiteBox}>
        <h2 className={styles.sectionTitle}>Contato</h2>
        <div className={styles.contactRow}>
          <span className={styles.contactLabel}>Email</span>
          <span className={styles.contactValue}>{company.email}</span>
        </div>
        <div className={styles.contactRow}>
          <span className={styles.contactLabel}>Telefone</span>
          <span className={styles.contactValue}>{company.phone}</span>
        </div>
        <div className={styles.contactRow}>
          <span className={styles.contactLabel}>CNPJ</span>
          <span className={styles.contactValue}>{company.cnpj}</span>
        </div>
        {company.online_url && (
          <div className={styles.contactRow}>
            <span className={styles.contactLabel}>Site</span>
            <a
              href={company.online_url}
              target="_blank"
              rel="noopener"
              className={styles.contactValue}
            >
              {company.online_url}
            </a>
          </div>
        )}
      </div>

      {/* STATUS */}
      <div className={styles.whiteBox}>
        <h2 className={styles.sectionTitle}>Status</h2>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Ativa</span>
          <span className={styles.infoValue}>
            {company.is_active ? 'Sim' : 'Não'}
          </span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Email verificado</span>
          <span className={styles.infoValue}>
            {company.email_verified ? 'Sim' : 'Não'}
          </span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Telefone verificado</span>
          <span className={styles.infoValue}>
            {company.phone_verified ? 'Sim' : 'Não'}
          </span>
        </div>
      </div>

      {/* CATEGORIAS */}
      {company.categories.length > 0 && (
        <div className={styles.whiteBox}>
          <h2 className={styles.sectionTitle}>Categorias</h2>
          <div className={styles.categoriesContainer}>
            {company.categories.map(cat => (
              <Link key={cat.id} href={`/categories/${cat.id}`} className={styles.categoryBadge}>
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* INFORMAÇÕES ADICIONAIS */}
      <div className={styles.whiteBox}>
        <h2 className={styles.sectionTitle}>Informações Adicionais</h2>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Cadastro em</span>
          <span className={styles.infoValue}>
            {new Date(company.created_at).toLocaleDateString()}
          </span>
        </div>
        {'serves_address' in company && (
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Atende endereço selecionado</span>
            <span className={styles.infoValue}>
              {(company as any).serves_address ? 'Sim' : 'Não'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

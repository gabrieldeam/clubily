'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import Header from '@/components/Header/Header';
import Modal from '@/components/Modal/Modal';
import CalendarRange from '@/components/CalendarRange/CalendarRange';

import styles from './page.module.css';

import {
  fetchTrackingBubbles,
  fetchTrackingMap,
  toBubbleSeriesRich,   // << versão “rica”
  toMapMarkersRich,     // << versão “rica”
} from '@/services/couponMetricsService';

import type { CouponBubblePoint, CouponMapPoint } from '@/types/couponMetrics';

/** Helpers */
function isoDate(d: Date) { return d.toISOString().slice(0, 10); }
function fmtK(n: number) {
  if (n >= 1000) return `${(n/1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(n);
}
function fmtBRL(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Leaflet dynamic imports (client-only) */
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer     = dynamic(() => import('react-leaflet').then(m => m.TileLayer),     { ssr: false });
const Marker        = dynamic(() => import('react-leaflet').then(m => m.Marker),        { ssr: false });
const Popup         = dynamic(() => import('react-leaflet').then(m => m.Popup),         { ssr: false });

type TabKey = 'names' | 'map';

export default function CouponsTrackingPage() {
  /** Período */
  const today = new Date();
  const [startDate, setStartDate] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));
  const [endDate, setEndDate]     = useState<Date>(new Date(today.getFullYear(), today.getMonth() + 1, 0));
  const [dateModalOpen, setDateModalOpen] = useState(false);

  const date_from = isoDate(startDate);
  const date_to   = isoDate(endDate);

  /** Dados */
  const [bubbles, setBubbles] = useState<CouponBubblePoint[] | null>(null);
  const [mapPoints, setMapPoints] = useState<CouponMapPoint[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  /** UI */
  const [tab, setTab] = useState<TabKey>('names');
  const [search, setSearch] = useState('');

  /** Carregar dados (memoizado para satisfazer o linter) */
  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [b, m] = await Promise.all([
        fetchTrackingBubbles(date_from, date_to),
        fetchTrackingMap(date_from, date_to),
      ]);
      setBubbles(b);
      setMapPoints(m);
    } catch (e) {
      console.error(e);
      setError('Erro ao carregar rastreamento de cupons.');
    } finally {
      setLoading(false);
    }
  }, [date_from, date_to]);

  /** Carrega inicial / quando período muda */
  useEffect(() => {
    loadAll();
  }, [loadAll]);

  /** Ajusta ícones do Leaflet (evita 404 nos PNGs) */
  useEffect(() => {
    (async () => {
      if (typeof window === 'undefined') return;
      const L = await import('leaflet');
      // @ts-expect-error: propriedade interna não está no .d.ts do Leaflet
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    })();
  }, []);

  /** Derivados para UI */
  const bubbleSeries = useMemo(() => (bubbles ? toBubbleSeriesRich(bubbles) : []), [bubbles]);
  const markers = useMemo(() => (mapPoints ? toMapMarkersRich(mapPoints) : []), [mapPoints]);

  /** KPIs corrigidos — somam BUBBLES + MAP, e contam cupons distintos nos dois conjuntos */
  const usesTotal = useMemo(() => {
    const sumB = (bubbles ?? []).reduce((acc, b) => acc + (b.uses || 0), 0);
    const sumM = (mapPoints ?? []).reduce((acc, m) => acc + (m.uses || 0), 0);
    return sumB + sumM;
  }, [bubbles, mapPoints]);

  const couponsDistinct = useMemo(() => {
    const ids = new Set<string>();
    (bubbles ?? []).forEach(b => ids.add(b.coupon_id));
    (mapPoints ?? []).forEach(m => ids.add(m.coupon_id));
    return ids.size;
  }, [bubbles, mapPoints]);

  /** Busca (apenas na aba nomes) */
  const filteredBubbles = useMemo(() => {
    if (!bubbleSeries.length) return [];
    if (!search.trim()) return bubbleSeries;
    const t = search.toLowerCase();
    return bubbleSeries.filter(b =>
      (b.label || '').toLowerCase().includes(t) ||
      (b.code || '').toLowerCase().includes(t)
    );
  }, [bubbleSeries, search]);

  /** Presença de dados por aba + tabs dinâmicas */
  const hasNames = (bubbles?.length ?? 0) > 0;
  const hasMap   = markers.length > 0;

  const availableTabs: TabKey[] = useMemo(() => {
    const arr: TabKey[] = [];
    if (hasNames) arr.push('names');
    if (hasMap)   arr.push('map');
    return arr;
  }, [hasNames, hasMap]);

  /** Se a aba atual deixar de existir (ex.: período sem dados), troca automaticamente */
  useEffect(() => {
    if (!availableTabs.includes(tab)) {
      if (availableTabs.length) setTab(availableTabs[0]);
    }
  }, [availableTabs, tab]);

  /** Bounds / fallback Brasil */
  const defaultCenter: [number, number] = [-14.2350, -51.9253]; // BR
  function getMapCenter(): [number, number] {
    if (!markers.length) return defaultCenter;
    const lat = markers.reduce((a, m) => a + m.position.lat, 0) / markers.length;
    const lng = markers.reduce((a, m) => a + m.position.lng, 0) / markers.length;
    return [lat, lng];
  }

  if (loading) return (
    <>
      <Header />
      <div className={styles.container}>
        <main className={styles.main}>
          <div className={styles.loading}>Carregando rastreamento...</div>
        </main>
      </div>
    </>
  );

  if (error) return (
    <>
      <Header />
      <div className={styles.container}>
        <main className={styles.main}>
          <div className={styles.error}>{error}</div>
        </main>
      </div>
    </>
  );

  const showTabsBar = availableTabs.length > 1;

  return (
    <>
      {/* CSS do Leaflet */}
      <Head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </Head>

      <Header />
      <div className={styles.container}>
        <main className={styles.main}>

          {/* Header + período */}
          <section className={styles.header}>
            <div>
              <h1>Rastreamento de Cupons</h1>
              <p className={styles.subtitle}>Entenda onde e quais cupons estão sendo usados.</p>
            </div>
            <button className={styles.rangeBtn} onClick={() => setDateModalOpen(true)}>
              {startDate.toLocaleDateString()} – {endDate.toLocaleDateString()}
            </button>
          </section>

          {/* KPIs (corrigidos) */}
          <section className={styles.metrics}>
            <div>
              <span>Total de usos</span>
              <strong>{usesTotal}</strong>
            </div>
            <div>
              <span>Cupons distintos</span>
              <strong>{couponsDistinct}</strong>
            </div>
            <div>
              <span>Pontos no mapa</span>
              <strong>{markers.length}</strong>
            </div>
            <div>
              <span>Período</span>
              <strong>{startDate.toLocaleDateString()} – {endDate.toLocaleDateString()}</strong>
            </div>
          </section>

          {/* Tabs (só aparece se houver 2) */}
          {showTabsBar && (
            <nav className={styles.tabs}>
              {availableTabs.map(k => (
                <button
                  key={k}
                  className={`${styles.tabBtn} ${tab === k ? styles.tabActive : ''}`}
                  onClick={() => setTab(k)}
                >
                  {k === 'names' ? 'Nomes' : 'Mapa'}
                </button>
              ))}
              <div className={styles.tabsRight}>
                {tab === 'names' && (
                  <input
                    className={styles.search}
                    placeholder="Buscar por nome ou código"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                )}
              </div>
            </nav>
          )}

          {/* Se não existe nenhum dado em nenhuma aba */}
          {!hasNames && !hasMap ? (
            <div className={styles.empty}>Sem dados para este período.</div>
          ) : (
            <>
              {/* Conteúdo condicional conforme a aba disponível/selecionada */}
              {(tab === 'names' || (!showTabsBar && hasNames)) && hasNames && (
                <section className={styles.namesTab}>
                  {filteredBubbles.length === 0 ? (
                    <div className={styles.empty}>Sem nomes para este período.</div>
                  ) : (
                    <>
                      {/* “Nuvem” de bolhas */}
                      <div className={styles.cloud}>
                        {filteredBubbles.map((b, idx) => {
                          const min = filteredBubbles[filteredBubbles.length - 1]?.value ?? 1;
                          const max = filteredBubbles[0]?.value ?? 1;
                          const ratio = max === min ? 1 : (b.value - min) / (max - min);
                          const font = 12 + Math.round(16 * ratio);   // 12–28px
                          const pad  = 6  + Math.round(8  * ratio);   // 6–14px
                          const bg   = `rgba(37, 99, 235, ${0.12 + 0.18 * ratio})`;
                          return (
                            <span
                              key={`${b.id}-${idx}`}
                              className={styles.cloudItem}
                              style={{ fontSize: `${font}px`, padding: `${pad}px ${pad+6}px`, background: bg }}
                              title={`${b.label} — ${b.code} • ${b.value} usos • ${fmtBRL(b.discount ?? 0)}`}
                            >
                              {b.label} <small className={styles.badge}>{fmtK(b.value)}</small>
                            </span>
                          );
                        })}
                      </div>

                      {/* Tabela ordenada */}
                      <div className={styles.tableWrapper}>
                        <div className={styles.tableHeader}>
                          <div className={styles.colRank}>#</div>
                          <div className={styles.colName}>Cupom</div>
                          <div className={styles.colCode}>Código</div>
                          <div className={styles.colUses}>Usos</div>
                        </div>
                        <div className={styles.tableBody}>
                          {filteredBubbles.map((b, i) => (
                            <div className={styles.tableRow} key={`${b.id}-row`}>
                              <div className={styles.colRank} data-label="#">
                                {i + 1}
                              </div>
                              <div className={styles.colName} data-label="Cupom:">
                                {b.label} <span className={styles.dim}>({b.name})</span>
                              </div>
                              <div className={styles.colCode} data-label="Código:">
                                {b.code}
                              </div>
                              <div className={styles.colUses} data-label="Usos:">
                                {b.value}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </section>
              )}

              {(tab === 'map' || (!showTabsBar && hasMap)) && hasMap && (
                <section className={styles.mapTab}>
                  <div className={styles.mapBox}>
                    <MapContainer
                      center={getMapCenter()}
                      zoom={4}
                      scrollWheelZoom
                      style={{ height: '100%', width: '100%', borderRadius: 12 }}
                    >
                      <TileLayer
                        attribution="&copy; OpenStreetMap contributors"
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {markers.map(m => (
                        <Marker position={[m.position.lat, m.position.lng]} key={m.id}>
                          <Popup>
                            <div className={styles.popup}>
                              <strong>{m.label}</strong><br />
                              Código: {m.code}<br />
                              Usos: {m.uses}<br />
                              Desconto: {fmtBRL(m.discount ?? 0)}
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                    </MapContainer>
                  </div>
                </section>
              )}
            </>
          )}

          {/* Modal de período */}
          <Modal open={dateModalOpen} onClose={() => setDateModalOpen(false)} width={520}>
            <div className={styles.calendarDropdown}>
              <CalendarRange
                selectedStartDate={startDate}
                selectedEndDate={endDate}
                onRangeChange={(s, e) => {
                  setStartDate(s);
                  if (e) { setEndDate(e); setDateModalOpen(false); }
                }}
              />
              <div className={styles.presetsWrapper}>
                <button
                  className={styles.presetBtn}
                  onClick={() => {
                    const now = new Date();
                    setStartDate(new Date(now.getFullYear(), now.getMonth(), 1));
                    setEndDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
                    setDateModalOpen(false);
                  }}
                >
                  Este mês
                </button>
                <button
                  className={styles.presetBtn}
                  onClick={() => {
                    const now = new Date();
                    const from = new Date(now); from.setDate(now.getDate() - 6);
                    setStartDate(from); setEndDate(now); setDateModalOpen(false);
                  }}
                >
                  Últimos 7 dias
                </button>
                <button
                  className={styles.presetBtn}
                  onClick={() => {
                    const now = new Date();
                    const from = new Date(now); from.setDate(now.getDate() - 29);
                    setStartDate(from); setEndDate(now); setDateModalOpen(false);
                  }}
                >
                  Últimos 30 dias
                </button>
                <button
                  className={styles.presetBtn}
                  onClick={() => {
                    const now = new Date();
                    setStartDate(new Date(now.getFullYear(), 0, 1));
                    setEndDate(now); setDateModalOpen(false);
                  }}
                >
                  Ano (YTD)
                </button>
              </div>
            </div>
          </Modal>

        </main>
      </div>
    </>
  );
}

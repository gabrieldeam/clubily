'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './MapPicker.module.css';

import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, useMap, useMapEvents, CircleMarker, Popup } from 'react-leaflet';

type Props = {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number, displayName?: string) => void;
};

type SearchResult = {
  display_name: string;
  lat: string;
  lon: string;
};

export default function MapPicker({ lat, lng, onChange }: Props) {
  const defaultCenter: [number, number] = [-23.55052, -46.633308];
  const [center, setCenter] = useState<[number, number]>(
    lat != null && lng != null ? [lat, lng] : defaultCenter
  );

  const [marker, setMarker] = useState<[number, number] | null>(
    lat != null && lng != null ? [lat, lng] : null
  );

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (lat != null && lng != null) {
      setCenter([lat, lng]);
      setMarker([lat, lng]);
    }
  }, [lat, lng]);

  function ClickHandler() {
    useMapEvents({
      click: async (e) => {
        const { latlng } = e;
        setMarker([latlng.lat, latlng.lng]);
        onChange(latlng.lat, latlng.lng);

        try {
          const url = new URL('https://nominatim.openstreetmap.org/reverse');
          url.searchParams.set('format', 'jsonv2');
          url.searchParams.set('lat', String(latlng.lat));
          url.searchParams.set('lon', String(latlng.lng));
          url.searchParams.set('zoom', '18');
          url.searchParams.set('addressdetails', '1');

          const res = await fetch(url.toString(), {
            headers: { 'Accept-Language': 'pt-BR' },
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.display_name) {
              onChange(latlng.lat, latlng.lng, data.display_name as string);
            }
          }
        } catch {
          /* ignore */
        }
      },
    });
    return null;
  }

  function CenterSetter() {
    const map = useMap();
    const [latC, lngC] = center;
    useEffect(() => {
      map.setView([latC, lngC]);
    }, [latC, lngC, map]);
    return null;
  }

  const doSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setResults([]);
    try {
      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('q', q);
      url.searchParams.set('format', 'jsonv2');
      url.searchParams.set('limit', '8');
      url.searchParams.set('addressdetails', '1');

      const res = await fetch(url.toString(), {
        headers: { 'Accept-Language': 'pt-BR' },
      });
      if (!res.ok) throw new Error('Search failed');
      const data = (await res.json()) as SearchResult[];
      setResults(data);
      setTimeout(() => listRef.current?.scrollIntoView({ behavior: 'smooth' }), 0);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const selectPlace = (r: SearchResult) => {
    const latNum = parseFloat(r.lat);
    const lngNum = parseFloat(r.lon);
    setCenter([latNum, lngNum]);
    setMarker([latNum, lngNum]);
    onChange(latNum, lngNum, r.display_name);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latNum = pos.coords.latitude;
        const lngNum = pos.coords.longitude;
        setCenter([latNum, lngNum]);
        setMarker([latNum, lngNum]);
        onChange(latNum, lngNum);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const hasMarker = useMemo(() => !!marker, [marker]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.searchBar}>
        <input
          className={styles.input}
          placeholder="Busque um local (rua, cidade, ponto de interesse)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') doSearch(); }}
        />
        <button
          type="button"
          className={styles.btn}
          onClick={doSearch}
          disabled={searching}
        >
          {searching ? 'Buscando...' : 'Buscar'}
        </button>
        <button
          type="button"
          className={styles.btnSecondary}
          onClick={useMyLocation}
        >
          Minha localização
        </button>
      </div>

      <div className={styles.mapContainer}>
        <MapContainer center={center} zoom={14} style={{ height: 360, width: '100%' }} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler />
          <CenterSetter />
          {hasMarker && marker && (
            <CircleMarker center={marker} radius={10}>
              <Popup>
                <div>
                  <strong>Selecionado:</strong>
                  <div>Lat: {marker[0].toFixed(6)}</div>
                  <div>Lng: {marker[1].toFixed(6)}</div>
                </div>
              </Popup>
            </CircleMarker>
          )}
        </MapContainer>
      </div>

      <div ref={listRef} className={styles.results}>
        {results.length > 0 && (
          <>
            <div className={styles.resultsHeader}>Resultados</div>
            <ul className={styles.resultsList}>
              {results.map((r, idx) => (
                <li
                  key={`${r.lat}-${r.lon}-${idx}`}
                  className={styles.resultItem}
                  onClick={() => selectPlace(r)}
                  title="Selecionar este local"
                >
                  {r.display_name}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className={styles.hint}>
        Dica: clique no mapa para posicionar o marcador. Você também pode usar o botão “Minha localização”.
      </div>
    </div>
  );
}

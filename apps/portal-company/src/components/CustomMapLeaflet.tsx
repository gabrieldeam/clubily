// src/components/CustomMapLeaflet.tsx
'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useState } from 'react';

interface Props {
  address: string;
  iconUrl: string;
}

/** Estrutura mínima retornada pelo Nominatim */
interface NominatimResult {
  lat: string;
  lon: string;
}

export default function CustomMapLeaflet({ address, iconUrl }: Props) {
  const [position, setPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address,
      )}`,
    )
      .then(res => res.json())
      .then((data: NominatimResult[]) => {
        if (data.length > 0) {
          setPosition([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        }
      })
      .catch(() => {}); // silencia erros de geocodificação
  }, [address]);

  if (!position) return <div>Carregando mapa…</div>;

  /* ---------- ícone circular com imagem ---------- */
  const html = `
    <div style="
      width: 32px;
      height: 32px;
      border-radius: 50%;
      overflow: hidden;
      border: 2px solid white;
      box-shadow: 0 0 4px rgba(0,0,0,0.3);
    ">
      <img src="${iconUrl}" 
           style="width: 100%; height: 100%; object-fit: cover;" />
    </div>
  `;

  const customIcon = new L.DivIcon({
    html,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  return (
    <MapContainer
      center={position}
      zoom={15}
      style={{ width: '100%', height: '200px' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; <a href='https://www.openstreetmap.org/'>OpenStreetMap</a> contributors"
      />
      <Marker position={position} icon={customIcon}>
        <Popup>{address}</Popup>
      </Marker>
    </MapContainer>
  );
}

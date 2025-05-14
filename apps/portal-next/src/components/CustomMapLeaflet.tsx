// src/components/CustomMapLeaflet.tsx
'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useState } from 'react';

interface Props {
  address: string;
  iconUrl: string;
}

export default function CustomMapLeaflet({ address, iconUrl }: Props) {
  const [position, setPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    // busca lat/lng no Nominatim
    fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `format=json&q=${encodeURIComponent(address)}`
    )
      .then(res => res.json())
      .then((data: any[]) => {
        if (data.length > 0) {
          setPosition([
            parseFloat(data[0].lat),
            parseFloat(data[0].lon),
          ]);
        }
      });
  }, [address]);

  if (!position) return <div>Carregando mapa…</div>;

  // cria ícone customizado
  const customIcon = new L.Icon({
    iconUrl,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
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

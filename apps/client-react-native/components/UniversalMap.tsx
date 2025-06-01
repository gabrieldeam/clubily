// components/UniversalMap.tsx

import React from 'react';
import { Platform, Image, View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, Callout, UrlTile } from 'react-native-maps';

interface UniversalMapProps {
  style?: object;
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  onRegionChangeComplete: (newRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }) => void;
  companies: Array<{
    id: string | number;
    coords: { latitude: number; longitude: number } | null;
    logo: string;
    name?: string;
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
  }>;
}

export default function UniversalMap({
  style,
  region,
  onRegionChangeComplete,
  companies,
}: UniversalMapProps) {
  return (
    <MapView
      style={style}
      region={region}
      onRegionChangeComplete={onRegionChangeComplete}
      // NO ANDROID: desabilita o provider padrão (Google) para que só apareça OSM via UrlTile
      mapType={Platform.OS === 'android' ? 'none' : undefined}
    >
      {Platform.OS === 'android' && (
        <UrlTile
          // Tiles oficiais do OpenStreetMap
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          tileSize={256}
        />
      )}

      {/** Markers + Callouts para todas as empresas (iOS + Android) **/}
      {companies.map((c) =>
        c.coords ? (
          <Marker key={c.id} coordinate={c.coords}>
            <Image source={{ uri: c.logo }} style={styles.markerImage} />
            <Callout>
              <View style={styles.callout}>
                {c.name ? <Text style={styles.calloutTitle}>{c.name}</Text> : null}
                <Text style={styles.calloutText}>
                  {c.street}, {c.city} - {c.state}, {c.postal_code}
                </Text>
              </View>
            </Callout>
          </Marker>
        ) : null
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  markerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  callout: {
    width: 200,
    padding: 8,
  },
  calloutTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  calloutText: {
    fontSize: 12,
  },
});

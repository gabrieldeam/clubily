import React, { useEffect, useState } from 'react';
import { Platform, View, ActivityIndicator, StyleSheet, Image, Text, Dimensions } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { useRouter } from 'expo-router';

import { searchCompanies } from '../../services/companyService';
import { imagePublicBaseUrl } from '../../services/api';
import { useAddress } from '../../context/AddressContext';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';

import type { CompanyRead, CompanyFilter } from '../../types/company';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.05;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

interface CompanyWithCoords extends CompanyRead {
  coords: { latitude: number; longitude: number } | null;
}

export default function MapsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { selectedAddress, filterField } = useAddress();

  const [companies, setCompanies] = useState<CompanyWithCoords[]>([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState({
    latitude: 0,
    longitude: 0,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  });

  // Logout handler
  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  // Geocode selected address to center map
  useEffect(() => {
    if (!selectedAddress) return;
    (async () => {
      try {
        const q = `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state}, ${selectedAddress.postal_code}`;
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`
        ).then(r => r.json());
        const first = (res as any[])[0];
        if (first) {
          setRegion(prev => ({
            ...prev,
            latitude: parseFloat(first.lat),
            longitude: parseFloat(first.lon),
          }));
        }
      } catch (err) {
        console.warn('Não foi possível geocodificar endereço:', err);
      }
    })();
  }, [selectedAddress]);

  // Fetch companies and geocode
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const filters: Partial<CompanyFilter> = {};
        if (selectedAddress && filterField !== 'country') {
          (filters as any)[filterField] = (selectedAddress as any)[filterField];
        }
        const res = await searchCompanies(filters as CompanyFilter);
        const data = res.data as CompanyRead[];

        const comps: CompanyWithCoords[] = await Promise.all(
          data.map(async c => {
            const q = `${c.street}, ${c.city}, ${c.state}, ${c.postal_code}`;
            try {
              const geo = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`
              ).then(r => r.json());
              const first = (geo as any[])[0];
              if (first) {
                return {
                  ...c,
                  coords: { latitude: parseFloat(first.lat), longitude: parseFloat(first.lon) },
                };
              }
            } catch {}
            return { ...c, coords: null };
          })
        );

        setCompanies(comps);

        // Center on first valid company
        const firstCo = comps.find(c => c.coords);
        if (firstCo) {
          setRegion(prev => ({
            ...prev,
            latitude: firstCo.coords!.latitude,
            longitude: firstCo.coords!.longitude,
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar empresas:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedAddress, filterField]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#FFA600" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header onSearch={query => { /* TODO: implementar filtro via texto */ }} />

      <MapView
        style={styles.map}
        initialRegion={region}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      >
        {companies.map(c =>
          c.coords ? (
            <Marker key={c.id} coordinate={c.coords}>
              <Image
                source={{ uri: `${imagePublicBaseUrl}${c.logo_url}` }}
                style={styles.markerImage}
              />
              <Callout>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{c.name}</Text>
                  <Text style={styles.calloutText}>
                    {c.street}, {c.city} - {c.state}, {c.postal_code}
                  </Text>
                </View>
              </Callout>
            </Marker>
          ) : null
        )}
      </MapView>

      <View style={styles.bottomBar}>
        <Text style={styles.bottomBarText}>Categorias</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  map: {
    flex: 1,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  bottomBar: {
    height: 50,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginBottom: 120,
  },
  bottomBarText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
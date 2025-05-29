import React, { useEffect, useState } from 'react';
import { Platform, View, ActivityIndicator, StyleSheet, Image, Text, Dimensions, TouchableOpacity } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { SvgUri } from 'react-native-svg';

import { searchCompanies, searchCompaniesByCategory } from '../../services/companyService';
import { imagePublicBaseUrl } from '../../services/api';
import { useAddress } from '../../context/AddressContext';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import { listUsedCategories } from '../../services/categoryService';

import type { CompanyRead, CompanyFilter } from '../../types/company';
import type { CategoryRead } from '../../types/category';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.05;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

interface CompanyWithCoords extends CompanyRead {
  coords: { latitude: number; longitude: number } | null;
}

export default function MapsScreen() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { selectedAddress, filterField } = useAddress()
  const [showOutsideWarning, setShowOutsideWarning] = useState(false);
  const [categories, setCategories] = useState<CategoryRead[]>([])
  const [loadingCats, setLoadingCats] = useState(false)
  const [companies, setCompanies] = useState<CompanyWithCoords[]>([])
  const [loading, setLoading] = useState(true)
  const [region, setRegion] = useState({
    latitude: 0,
    longitude: 0,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  })

 const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

  const handleLogout = async () => {
    await logout()
    router.replace('/')
  }

  const buildFilters = (): CompanyFilter => {
    const filters: any = {}
    if (!selectedAddress) return filters
    if (filterField === 'city') filters.city = selectedAddress.city
    else if (filterField === 'postal_code')
      filters.postal_code = selectedAddress.postal_code

    // inclui também o filtro de categoria, se houver
    if (selectedCategoryId) filters.category_id = selectedCategoryId

    return filters
  }

  const [cityBounds, setCityBounds] = useState<{
    south: number;
    north: number;
    west: number;
    east: number;
  } | null>(null);

  const handleRegionChangeComplete = (newRegion: typeof region) => {
  setRegion(newRegion);

  if (cityBounds) {
    const inside =
      newRegion.latitude  >= cityBounds.south  &&
      newRegion.latitude  <= cityBounds.north  &&
      newRegion.longitude >= cityBounds.west   &&
      newRegion.longitude <= cityBounds.east;

    setShowOutsideWarning(!inside);
  }
};

  const toggleCategory = (id: string) => {
    setSelectedCategoryId(prev => (prev === id ? null : id));
  };

  useEffect(() => {
  if (!selectedAddress) return;

  (async () => {
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&city=${encodeURIComponent(
          selectedAddress.city
        )}&limit=1&addressdetails=1`
      );
      const data = await resp.json();
      if (data[0]?.boundingbox) {
        const [south, north, west, east] = data[0].boundingbox.map((v: string) => parseFloat(v));
        setCityBounds({ south, north, west, east });
      }
    } catch (err) {
      console.warn('Não foi possível obter bounding box da cidade', err);
    }
  })();
}, [selectedAddress]);

  // Busca categorias e empresas (com ou sem categoria)
  useEffect(() => {
    if (!selectedAddress) return

    ;(async () => {
      setLoading(true)
      setLoadingCats(true)

      try {
        const filters = buildFilters()

        // fetch paralelo: categorias + empresas (pode usar searchCompaniesByCategory)
        const catsPromise = listUsedCategories(filters)
        const compsPromise = selectedCategoryId
          ? searchCompaniesByCategory(selectedCategoryId, filters)
          : searchCompanies(filters)

        const [catsRes, compsRes] = await Promise.all([
          catsPromise,
          compsPromise,
        ])

        setCategories(catsRes.data)

        // geocodifica local (temporário)
        const withCoords = await Promise.all(
          compsRes.data.map(async c => {
            const q = `${c.street}, ${c.city}, ${c.state}, ${c.postal_code}`
            try {
              const geo = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                  q
                )}`
              ).then(r => r.json())
              const first = (geo as any[])[0]
              return {
                ...c,
                coords: first
                  ? {
                      latitude: parseFloat(first.lat),
                      longitude: parseFloat(first.lon),
                    }
                  : null,
              }
            } catch {
              return { ...c, coords: null }
            }
          })
        )

        setCompanies(withCoords)

        // recentra no primeiro
        const firstCo = withCoords.find(c => c.coords)
        if (firstCo) {
          setRegion({
            latitude: firstCo.coords!.latitude,
            longitude: firstCo.coords!.longitude,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          })
        }
      } catch (err) {
        console.error('Erro ao carregar dados do mapa:', err)
      } finally {
        setLoading(false)
        setLoadingCats(false)
      }
    })()
  }, [selectedAddress, filterField, selectedCategoryId])

  useEffect(() => {
  if (!cityBounds) return;
  const inside = 
    region.latitude  >= cityBounds.south &&
    region.latitude  <= cityBounds.north &&
    region.longitude >= cityBounds.west  &&
    region.longitude <= cityBounds.east;
  setShowOutsideWarning(!inside);
}, [region, cityBounds]);


  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#FFA600" />
      </View>
    )
  }


  return (
    <View style={styles.container}>
      <Header onSearch={query => { /* TODO: implementar filtro via texto */ }} />

      {showOutsideWarning && selectedAddress && (
        <View style={styles.outsideModal}>
          <Text style={styles.outsideText}>
            Você está navegando fora da área filtrada ({selectedAddress.city}).
          </Text>
        </View>
      )}

      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={handleRegionChangeComplete}
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

      {categories.length > 0 && (
        <View style={styles.whiteBox}>
          <Text style={styles.title}>Categorias</Text>
          <View style={styles.grid}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}                
                onPress={() => toggleCategory(cat.id)}
              >
               <View 
               style={[
                  styles.catImageWrapper,
                  selectedCategoryId === cat.id && styles.catItemSelected
                ]}>
                 <SvgUri
                   uri={`${imagePublicBaseUrl}${cat.image_url}`}
                   width="100%"
                   height="100%"
                 />
               </View>
               <Text style={styles.catName}>{cat.name}</Text>
             </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
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
  whiteBox: { marginTop: 10, backgroundColor: '#FFF', borderRadius: 20, padding: 16, width: '100%', marginBottom: 120 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#000' },
  catItemSelected: { backgroundColor: 'white', borderColor: 'black', borderWidth: 2, },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  catImageWrapper: { width: 80, height: 80, padding: 15, backgroundColor: '#F0F0F0', borderColor: '#D9D9D9', borderWidth: 1, borderRadius: 40, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  catName: { marginTop: 8, textAlign: 'center', color: '#000' },
  outsideModal: {
  position: 'absolute',
  top: 10,
  left: '5%',
  right: '5%',
  backgroundColor: 'rgba(0,0,0,0.7)',
  paddingVertical: 6,
  paddingHorizontal: 12,
  borderRadius: 8,
  zIndex: 10,     
  elevation: 10,   
  alignItems: 'center',
},
outsideText: {
  color: '#FFF',
  fontSize: 14,
},
});

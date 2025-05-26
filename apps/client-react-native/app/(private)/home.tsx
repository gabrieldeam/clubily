import React, { useEffect, useState } from 'react';
import { Platform, View, StyleSheet, Text, ActivityIndicator, TouchableOpacity, Image, ScrollView } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import Header from '../../components/Header';
import AddressModal from '../../components/AddressModal';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useAddress } from '../../context/AddressContext';
import { listUsedCategories } from '../../services/categoryService';
import { searchCompanies } from '../../services/companyService';
import { imagePublicBaseUrl } from '../../services/api';
import { SvgUri } from 'react-native-svg';
import type { CategoryRead } from '../../types/category';
import type { CompanyRead, CompanyFilter } from '../../types/company';

export default function HomeScreen() {
  const { user } = useAuth();
  const { selectedAddress, filterField } = useAddress();
  const router = useRouter();

  const [showModal, setShowModal] = useState(false);
  const [categories, setCategories] = useState<CategoryRead[]>([]);
  const [companies, setCompanies] = useState<CompanyRead[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [loadingComps, setLoadingComps] = useState(false);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const buildFilters = (): CompanyFilter => {
    const filters: any = {};
    if (!selectedAddress) return filters;
    if (filterField === 'city') filters.city = selectedAddress.city;
    else if (filterField === 'postal_code') filters.postal_code = selectedAddress.postal_code;
    return filters;
  };

  // fetch categories and companies
  useEffect(() => {
    if (!selectedAddress) return;
    const filters = buildFilters();

    setLoadingCats(true);
    listUsedCategories(filters)
      .then(res => setCategories(res.data))
      .catch(() => setCategories([]))
      .finally(() => setLoadingCats(false));

    setLoadingComps(true);
    searchCompanies(filters)
      .then(res => setCompanies(res.data))
      .catch(() => setCompanies([]))
      .finally(() => setLoadingComps(false));
  }, [selectedAddress, filterField]);

const geocodeAddress = async (address: string) => {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'clubily-app/1.0 (contato@clubily.com.br)',
      'Referer'   : 'https://clubily.com.br',
    },
  });
  const data = await res.json();
  return data[0]
    ? { latitude: +data[0].lat, longitude: +data[0].lon }
    : null;
};

// 3. substitua seu useEffect atual por:
useEffect(() => {
  if (!selectedAddress) {
    setCoords(null);
    return;
  }
  const q = `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state}, ${selectedAddress.postal_code}`;
  geocodeAddress(q)
    .then(c => setCoords(c))
    .catch(() => setCoords(null));
}, [selectedAddress]);

  if (!selectedAddress) {
    return (
      <View style={styles.container}>
        <Header showUser userName={user?.name} onSearch={() => {}} />
        <View style={styles.whiteBox}>
          <Text style={styles.title}>Endereço</Text>
          <Text style={styles.addressText}>Nenhum endereço selecionado.</Text>
          <TouchableOpacity onPress={() => setShowModal(true)}>
            <Text style={styles.linkText}>Selecionar Endereço</Text>
          </TouchableOpacity>
          <AddressModal visible={showModal} onClose={() => setShowModal(false)} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Header showUser userName={user?.name} onSearch={() => {}} />
      <AddressModal visible={showModal} onClose={() => setShowModal(false)} />

      {/* Parceiros loading or none */}
      {loadingCats && <ActivityIndicator color="#FFA600" style={{ margin: 20 }} />}
      {!loadingCats && categories.length === 0 && (
        <View style={styles.whiteBox}>
          <Text style={styles.title}>Parceiros</Text>
          <Text style={styles.emptyText}>Não temos parceiros na sua localização.</Text>
        </View>
      )}

      {/* Categorias */}
      {categories.length > 0 && (
        <View style={styles.whiteBox}>
          <Text style={styles.title}>Categorias</Text>
          <View style={styles.grid}>
            {categories.map(cat => (
              <View key={cat.id}>
                <View style={styles.catImageWrapper}>
                  <SvgUri uri={`${imagePublicBaseUrl}${cat.image_url}`} width="100%" height="100%" />
                </View>
                <Text style={styles.catName}>{cat.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Descubra agora + Empresas abaixo */}
      {categories.length > 0 && (
        <View style={styles.whiteBox}>
          <Text style={styles.title}>Descubra agora</Text>
          {coords ? (
            <View style={styles.mapWrapper}>
              <MapView
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                style={styles.map}
                region={{ latitude: coords.latitude, longitude: coords.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
              
                    scrollEnabled={false}
                    zoomEnabled={false}
                    rotateEnabled={false}
                    pitchEnabled={false}
              />
              <TouchableOpacity style={styles.exploreButton} onPress={() => router.push({ pathname: '/maps' })}>
                <Text style={styles.exploreText}>Explorar mapa</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyContainer}><Text style={styles.emptyText}>Não foi possível localizar endereço.</Text></View>
          )}

          {/* Lista de empresas logo abaixo do mapa */}
          {loadingComps ? (
            <ActivityIndicator color="#FFA600"/>
          ) : (
            companies.map(comp => (
              <View key={comp.id} style={styles.companyCard}>
                {comp.logo_url && (
                  <Image source={{ uri: `${imagePublicBaseUrl}${comp.logo_url}` }} style={styles.companyLogo} />
                )}
                <View style={styles.companyInfo}>
                  <Text style={styles.companyName}>{comp.name}</Text>
                  <Text style={styles.companyDesc}>{comp.description}</Text>
                </View>
                <TouchableOpacity style={styles.companyBtn} onPress={() => router.push({ pathname: '/companies/[id]', params: { id: comp.id } })}>
                  <Text style={styles.companyBtnText}>Ver empresa</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      )}

      {/* Localização */}
      {/* {categories.length > 0 && (
        <View style={styles.whiteBox}>
          <Text style={styles.title}>Localização</Text>
          <Text style={styles.addressText}>{selectedAddress.street}, {selectedAddress.city} - {selectedAddress.state}, {selectedAddress.postal_code}</Text>
        </View>
      )} */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  whiteBox: { marginTop: 10, backgroundColor: '#FFF', borderRadius: 20, padding: 16, width: '100%' },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#000' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  catImageWrapper: { width: 80, height: 80, padding: 15, backgroundColor: '#F0F0F0', borderColor: '#D9D9D9', borderWidth: 1, borderRadius: 40, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  catName: { marginTop: 8, textAlign: 'center', color: '#000' },
  mapWrapper: { position: 'relative', width: '100%', height: 120, borderRadius: 10, overflow: 'hidden', marginBottom: 10 },
  map: { width: '100%', height: '100%' },
  exploreButton: { position: 'absolute', bottom: 8, right: 8, backgroundColor: '#F0F0F0', borderColor: '#D9D9D9', borderWidth: 1, borderRadius: 50, paddingHorizontal: 12, paddingVertical: 6 },
  exploreText: { color: '#000' },
  addressText: { fontSize: 16, color: '#000' },
  emptyContainer: { paddingVertical: 40, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#666' },
  linkText: { color: '#FFA600', marginTop: 8 },
  companyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F0F0', borderRadius: 10, padding: 12 },
  companyLogo: { width: 60, height: 60, borderRadius: 50, marginRight: 12, backgroundColor: '#FFA600' },
  companyInfo: { flex: 1 },
  companyName: { fontSize: 16, fontWeight: '600', color: '#000' },
  companyDesc: { fontSize: 14, color: '#333', marginTop: 4 },
  companyBtn: { backgroundColor: '#F0F0F0', borderColor: '#D9D9D9', borderWidth: 1, borderRadius: 50, paddingHorizontal: 12, paddingVertical: 6 },
  companyBtnText: { color: '#000', fontWeight: '500' },
});
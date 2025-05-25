import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, ScrollView } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import { useLocalSearchParams, Stack } from 'expo-router';
import { getCompanyInfo } from '../../../services/companyService';
import { imagePublicBaseUrl } from '../../../services/api';
import type { CompanyRead } from '../../../types/company';
import Header from '../../../components/Header';

export default function CompanyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [company, setCompany] = useState<CompanyRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);  

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getCompanyInfo(id)
      .then(res => {
        const data = res.data;
        setCompany(data);
        const q = `${data.street}, ${data.city}, ${data.state}, ${data.postal_code}`;
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`)
          .then(r => r.json())
          .then((arr: any[]) => {
            if (arr[0]) {
              setCoords({ latitude: +arr[0].lat, longitude: +arr[0].lon });
            }
          })
          .catch(() => {});
      })
      .catch(() => setError('Erro ao carregar informações da empresa'))
      .finally(() => setLoading(false));
  }, [id]);

  const firstCat = company?.categories?.[0];

  // defina constantes logo acima do seu JSX, por exemplo:
  const LATITUDE_DELTA = 0.01;
  const LONGITUDE_DELTA = 0.01;
  // quanto “abaixo” em relação ao total do delta (30%)
  const VERTICAL_OFFSET_FACTOR = -0.3;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: company?.name || 'Empresa' }} />
      <Header showUser={false} />

      {loading && <ActivityIndicator color="#FFA600" style={{ marginTop: 20 }} />}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {company && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>

          {/* ROW: logo/info/descrição & primeira categoria */}
          <View style={styles.whiteBox}>

              {/* ROW: logo/info/descrição & primeira categoria */}
              <View style={styles.infoMapSection}>
                <View style={styles.infoColumn}>
                  {company.logo_url && (
                    <Image
                      source={{ uri: `${imagePublicBaseUrl}${company.logo_url}` }}
                      style={styles.logo}
                    />
                  )}
                  <View style={styles.textContainer}>
                    <Text style={styles.name}>{company.name}</Text>
                    {company.description && (
                      <Text style={styles.description}>{company.description}</Text>
                    )}
                  </View>
                </View>
                {firstCat && (
                  <View style={styles.categoryIconWrapper}>
                    <Image
                      source={{
                        uri: firstCat.image_url
                          ? `${imagePublicBaseUrl}${firstCat.image_url}`
                          : `${imagePublicBaseUrl}/path/to/placeholder.svg`
                      }}
                      style={styles.categoryIcon}
                    />
                  </View>
                )}
              </View>
              
              {/* Mapa justo abaixo */}
              {coords && (
                <View style={styles.mapWrapper}>                  
                <Text style={styles.sectionTitle}>Endereço</Text>
                  <MapView
                    provider={PROVIDER_GOOGLE}
                    style={styles.map}
                    region={{
                      latitude: coords.latitude - LATITUDE_DELTA * VERTICAL_OFFSET_FACTOR,
                      longitude: coords.longitude,
                      latitudeDelta: LATITUDE_DELTA,
                      longitudeDelta: LONGITUDE_DELTA,
                    }}
                    scrollEnabled={false}
                    zoomEnabled={false}
                    rotateEnabled={false}
                    pitchEnabled={false}
                  >
                    <Marker coordinate={coords}>
                      <View style={styles.markerContainer}>
                        <Image
                          source={{ uri: `${imagePublicBaseUrl}${company.logo_url}` }}
                          style={styles.markerImage}
                        />
                      </View>
                      <Callout tooltip>
                        {/* largura aplicada nesta View */}
                        <View style={styles.calloutBox}>
                          <Text style={styles.calloutText}>{company.street}</Text>
                          <Text style={styles.calloutText}>
                            {company.city} - {company.state}, {company.postal_code}
                          </Text>
                        </View>
                      </Callout>
                    </Marker>
                  </MapView>
                </View>
              )}

            </View>
          

          {/* Contato */}
          <View style={styles.whiteBox}>
            <Text style={styles.sectionTitle}>Contato</Text>

            <View style={styles.contactRow}>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactValue}>{company.email}</Text>
            </View>

            <View style={styles.contactRow}>
              <Text style={styles.contactLabel}>Telefone</Text>
              <Text style={styles.contactValue}>{company.phone}</Text>
            </View>

            <View style={styles.contactRow}>
              <Text style={styles.contactLabel}>CNPJ</Text>
              <Text style={styles.contactValue}>{company.cnpj}</Text>
            </View>
          </View>

          {/* Endereço */}
          {/* <View style={styles.whiteBox}>
            <Text style={styles.sectionTitle}>Endereço</Text>
            <Text>{company.street}</Text>
            <Text>{company.city} - {company.state}, {company.postal_code}</Text>
          </View> */}

          {/* Status */}
          <View style={styles.whiteBox}>
            <Text style={styles.sectionTitle}>Status</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ativa</Text>
              <Text style={styles.infoValue}>{company.is_active ? 'Sim' : 'Não'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email verificado</Text>
              <Text style={styles.infoValue}>{company.email_verified ? 'Sim' : 'Não'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Telefone verificado</Text>
              <Text style={styles.infoValue}>{company.phone_verified ? 'Sim' : 'Não'}</Text>
            </View>
          </View>


          {/* Categorias */}
          {company.categories.length > 0 && (
            <View style={styles.whiteBox}>
              <Text style={styles.sectionTitle}>Categorias</Text>
              <View style={styles.categories}>
                {company.categories.map(cat => (
                  <Text key={cat.id} style={styles.categoryItem}>• {cat.name}</Text>
                ))}
              </View>
            </View>
          )}

          {/* Informações Adicionais */}
          <View style={styles.whiteBox}>
            <Text style={styles.sectionTitle}>Informações Adicionais</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cadastro em</Text>
              <Text style={styles.infoValue}>
                {new Date(company.created_at).toLocaleDateString()}
              </Text>
            </View>

            {'serves_address' in company && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Atende endereço selecionado</Text>
                <Text style={styles.infoValue}>
                  {(company as any).serves_address ? 'Sim' : 'Não'}
                </Text>
              </View>
            )}
          </View>

        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scrollContent: { paddingTop: 10, paddingBottom: 130, },
  infoMapSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mapWrapper: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginTop: 12,
    overflow: 'visible',
  },
  infoColumn: {
    flexDirection: 'row',     
    alignItems: 'center',  
    flex: 1,
    marginRight: 12,
  },
  textContainer: {
    marginLeft: 12,           
    flexShrink: 1,          
  },
calloutBox: {
    width: 240,          // largura real do balão
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    alignItems: 'center',
  },
  calloutText: {
    fontSize: 14,
    color: '#000',
  },
  logo: { width: 80, height: 80, borderRadius: 40, marginBottom: 8, backgroundColor: '#FFA600' },
  name: { fontSize: 20, fontWeight: '600', color: '#000' },
  description: { fontSize: 14, color: '#333', marginTop: 4 },
  categoryIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIcon: { width: 40, height: 40, resizeMode: 'contain' },
  whiteBox: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  map: { width: '100%', height: 150, borderRadius: 10, overflow: 'hidden', },
   markerContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: '#FFA600',      // opcional, para uma borda branca
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  contactLabel: {
    color: '#000',          // preto
    fontWeight: '500',
  },
  contactValue: {
    color: '#878787',       // cinza
  },
    infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  infoLabel: {
    color: '#000',        // preto
    fontWeight: '500',
  },
  infoValue: {
    color: '#878787',     // cinza
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8, color: '#000' },
  categories: { flexDirection: 'row', flexWrap: 'wrap' },
  categoryItem: { marginRight: 8, marginBottom: 4, color: '#000' },
  errorText: { color: 'red', textAlign: 'center', marginTop: 20 },
});

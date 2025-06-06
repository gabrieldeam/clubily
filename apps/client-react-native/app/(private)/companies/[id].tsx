import React, { useEffect, useState } from 'react';
import {
  Platform,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useLocalSearchParams, Stack, Link } from 'expo-router';
import { getCompanyInfo } from '../../../services/companyService';
import { imagePublicBaseUrl } from '../../../services/api';
import type { CompanyRead } from '../../../types/company';
import Header from '../../../components/Header';
import MapSvg from '../../../assets/images/mapUser.svg';
import { SvgUri } from 'react-native-svg';

export default function CompanyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [company, setCompany] = useState<CompanyRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    getCompanyInfo(id)
      .then(res => {
        const data = res.data;
        setCompany(data);

        // Se a empresa não é apenas online, buscamos coordenadas
        if (!data.only_online) {
          const q = `${data.street}, ${data.city}, ${data.state}, ${data.postal_code}`;
          fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`)
            .then(r => r.json())
            .then((arr: any[]) => {
              if (arr[0]) {
                setCoords({ latitude: +arr[0].lat, longitude: +arr[0].lon });
              }
            })
            .catch(() => {
              // Ignora erro de geocoding
            });
        }
      })
      .catch(() => setError('Erro ao carregar informações da empresa'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleOpenMap = () => {
    if (!company) return;

    if (coords) {
      const lat = coords.latitude;
      const lng = coords.longitude;
      const label = company.name || 'Local';

      let url = '';
      if (Platform.OS === 'ios') {
        url = `maps:0,0?q=${lat},${lng}(${encodeURIComponent(label)})`;
      } else {
        url = `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(label)})`;
      }

      Linking.openURL(url).catch(() => {
        const fallback = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        Linking.openURL(fallback);
      });
    } else {
      const address = `${company.street}, ${company.city}, ${company.state}, ${company.postal_code}`;
      const addressEncoded = encodeURIComponent(address);

      let url = '';
      if (Platform.OS === 'ios') {
        url = `maps:0,0?q=${addressEncoded}`;
      } else {
        url = `geo:0,0?q=${addressEncoded}`;
      }

      Linking.openURL(url).catch(() => {
        const fallback = `https://www.google.com/maps/search/?api=1&query=${addressEncoded}`;
        Linking.openURL(fallback);
      });
    }
  };

  const handleOpenSite = () => {
    if (!company?.online_url) return;
    let url = company.online_url;
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    Linking.openURL(url).catch(() => {
      // Opcional: exibir alerta de erro
    });
  };

  const firstCat = company?.categories?.[0];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: company?.name || 'Empresa' }} />
      <Header showUser={false} />

      {loading && <ActivityIndicator color="#FFA600" style={{ marginTop: 20 }} />}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {company && (
        <>
          {/* Banner de empresa desativada */}
          {!company.is_active && (
            <View style={styles.inactiveBanner}>
              <Text style={styles.inactiveBannerText}>Essa empresa está desativada</Text>
            </View>
          )}

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
          >
            {/* ======== Bloco: LOGO + INFORMAÇÕES + CATEGORIA ======== */}
            <View style={styles.whiteBox}>
              <View style={styles.infoMapSection}>
                <View style={styles.infoColumn}>
                  {company.logo_url && (() => {
                    const logoUri = `${imagePublicBaseUrl}${company.logo_url}`;
                    const isSvg = logoUri.toLowerCase().endsWith('.svg');

                    return isSvg ? (
                      <SvgUri
                        uri={logoUri}
                        width={80}
                        height={80}
                      />
                    ) : (
                      <Image
                        source={{ uri: logoUri }}
                        style={styles.logo}
                        onError={e => console.warn('Erro ao carregar logo PNG/JPG:', e.nativeEvent.error)}
                      />
                    );
                  })()}
                  <View style={styles.textContainer}>
                    <Text style={styles.name}>{company.name}</Text>
                    {company.description && (
                      <Text style={styles.description}>{company.description}</Text>
                    )}
                  </View>
                </View>

                {/* Renderiza a primeira categoria + badge se houver mais de uma */}
                {firstCat && (() => {
                  const imageUri = firstCat.image_url
                    ? `${imagePublicBaseUrl}${firstCat.image_url}`
                    : `${imagePublicBaseUrl}/path/to/placeholder.svg`;
                  const isSvg = imageUri.toLowerCase().endsWith('.svg');
                  const totalCats = company.categories.length;

                  return (
                    <Link
                      href={{
                        pathname: '/categories/[id]',
                        params: { id: firstCat.id }
                      }}
                      asChild
                    >
                      <TouchableOpacity style={styles.categoryIconWrapper}>
                        {isSvg ? (
                          <SvgUri
                            uri={imageUri}
                            width={40}
                            height={40}
                          />
                        ) : (
                          <Image
                            source={{ uri: imageUri }}
                            style={styles.categoryIcon}
                          />
                        )}

                        {/* Badge de quantidade de categorias */}
                        {totalCats > 1 && (
                          <View style={styles.categoryCountBadge}>
                            <Text style={styles.categoryCountText}>{totalCats}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </Link>
                  );
                })()}
              </View>

              {/* ======== Bloco: ENDEREÇO ou BOTÃO “VISITAR SITE” ======== */}
              {company.only_online ? (
                <View style={styles.onlyOnlineBox}>
                  <Text style={styles.sectionTitle}>Esta loja é apenas online</Text>
                  {company.online_url && (
                    <TouchableOpacity style={styles.visitButton} onPress={handleOpenSite}>
                      <Text style={styles.visitButtonText}>Visitar Site</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <>
                  <Text style={styles.sectionTitle}>Endereço</Text>
                  <View style={styles.addressCard}>
                    <MapSvg
                      width={100}
                      height={100}
                      style={styles.mapImage}
                    />
                    <View style={styles.addressInfo}>
                      <Text style={styles.addressText}>{company.street}</Text>
                      <Text style={styles.addressText}>
                        {company.city} – {company.state}, {company.postal_code}
                      </Text>
                      <TouchableOpacity style={styles.mapButton} onPress={handleOpenMap}>
                        <Text style={styles.mapButtonText}>Ver no Mapa</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* ======== Bloco: CONTATO ======== */}
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
              {company.online_url ? (
                <View style={styles.contactRow}>
                  <Text style={styles.contactLabel}>Site</Text>
                  <TouchableOpacity onPress={handleOpenSite}>
                    <Text style={[styles.contactValue, styles.linkText]}>
                      {company.online_url.replace(/^https?:\/\//, '')}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            {/* ======== Bloco: STATUS ======== */}
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

            {/* ======== Bloco: CATEGORIAS ======== */}
            {company.categories.length > 0 && (
              <View style={styles.whiteBox}>
                <Text style={styles.sectionTitle}>Categorias</Text>
                <View style={styles.categoriesContainer}>
                  {company.categories.map(cat => (
                    <Link
                      key={cat.id}
                      href={{
                        pathname: '/categories/[id]',
                        params: { id: cat.id }
                      }}
                      asChild
                    >
                      <TouchableOpacity style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>{cat.name}</Text>
                      </TouchableOpacity>
                    </Link>
                  ))}
                </View>
              </View>
            )}

            {/* ======== Bloco: INFORMAÇÕES ADICIONAIS ======== */}
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
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    paddingTop: 10,
    paddingBottom: 110,
  },
  whiteBox: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    width: '100%',
  },
  inactiveBanner: {
    backgroundColor: '#FFA600',
    borderRadius: 20,
    padding: 16,
    marginTop: 10,
    alignItems: 'center',
  },
  inactiveBannerText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoMapSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
    backgroundColor: '#FFA600',
  },
  textContainer: {
    marginLeft: 12,
    flexShrink: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  description: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  categoryIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  categoryCountBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFA600',
    borderWidth: 1,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryCountText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },

  /* ====== NOVOS ESTILOS PARA A SEÇÃO “ENDEREÇO” ====== */
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  mapImage: {
    width: 100,
    height: '100%',
    borderRadius: 10,
    resizeMode: 'cover',
    marginRight: 16,
    overflow: 'hidden',
  },
  addressInfo: {
    flex: 1,
  },
  addressText: {
    color: '#000',
    fontSize: 14,
    marginBottom: 4,
  },
  mapButton: {
    backgroundColor: '#FFA600',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  mapButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },

  /* ====== ESTILOS PARA “APENAS ONLINE” ====== */
  onlyOnlineBox: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  visitButton: {
    backgroundColor: '#FFA600',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 12,
  },
  visitButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },

  /* ====== ESTILOS EXISTENTES ====== */
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  contactLabel: {
    color: '#000',
    fontWeight: '500',
  },
  contactValue: {
    color: '#878787',
  },
  linkText: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  infoLabel: {
    color: '#000',
    fontWeight: '500',
  },
  infoValue: {
    color: '#878787',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  categoryBadge: {
    backgroundColor: '#F9F9F9',
    padding: 5,
    marginRight: 8,
    borderRadius: 4,
  },
  categoryBadgeText: {
    color: '#000',
    fontSize: 14,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  ScrollView
} from 'react-native';
import MapNull from '../../assets/icons/mapNull.svg';
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


  // Se não houver endereço selecionado, exibe o fluxo antigo
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

  // Se estiver carregando categorias, mantém o spinner
  if (loadingCats) {
    return (
      <View style={styles.container}>
        <Header showUser userName={user?.name} onSearch={() => {}} />
        <ActivityIndicator color="#FFA600" style={{ margin: 20 }} />
      </View>
    );
  }

  // Se não houver categorias (parceiros), mostramos apenas o whiteBox2
  if (!loadingCats && categories.length === 0) {
    return (
      <View style={styles.container}>
        <Header showUser userName={user?.name} onSearch={() => {}} />
        <AddressModal visible={showModal} onClose={() => setShowModal(false)} />

        <View style={styles.whiteBox2}>
          <MapNull width={120} height={120} />
          <Text style={styles.emptyText}>
            Não temos parceiros na sua localização.
          </Text>
        </View>
      </View>
    );
  }

  // Se chegou até aqui, é porque há categorias para exibir:
  return (
    <View style={styles.container}>
      <Header showUser userName={user?.name} onSearch={() => {}} />
      <AddressModal visible={showModal} onClose={() => setShowModal(false)} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
        nestedScrollEnabled
      >
        {/* Categorias com rolagem horizontal */}
        {categories.length > 0 && (
          <View style={styles.whiteBox}>
            <Text style={styles.title}>Categorias</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.catWrapper}
                  activeOpacity={0.8}
                  onPress={() => {
                    router.push({
                      pathname: '/categories/[id]',
                      params: { id: cat.id },
                    });
                  }}
                >
                  <View style={styles.catImageWrapper}>
                    <SvgUri
                      uri={`${imagePublicBaseUrl}${cat.image_url}`}
                      width="100%"
                      height="100%"
                    />
                  </View>
                  <Text style={styles.catName}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                key="all"
                style={styles.catWrapper}
                activeOpacity={0.8}
                onPress={() => {
                  router.push('/categories');
                }}
              >
                <View style={styles.catImageWrapper}>
                  <Text style={styles.plusSign}>+</Text>
                </View>
                <Text style={styles.catName}>todas</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Descubra agora + até 5 empresas */}
        {categories.length > 0 && (
          <View style={styles.whiteBox}>
            <Text style={styles.title}>Descubra agora</Text>

            {loadingComps ? (
              <ActivityIndicator color="#FFA600" />
            ) : (
              <View>
                {companies.slice(0, 5).map((comp, index) => (
                  <View
                    key={comp.id}
                    style={[
                      styles.companyCard,
                      { marginBottom: index === 4 ? 0 : 10 },
                    ]}
                  >
                    {comp.logo_url &&
                      (() => {
                        const logoUri = `${imagePublicBaseUrl}${comp.logo_url}`;
                        const isSvg = logoUri.toLowerCase().endsWith('.svg');
                        return isSvg ? (
                          <SvgUri uri={logoUri} width={80} height={80} />
                        ) : (
                          <Image
                            source={{ uri: logoUri }}
                            style={styles.companyLogo}
                            onError={(e) =>
                              console.warn(
                                'Erro ao carregar logo PNG/JPG:',
                                e.nativeEvent.error
                              )
                            }
                          />
                        );
                      })()}

                    <View style={styles.companyInfo}>
                      <Text style={styles.companyName}>{comp.name}</Text>
                      <Text style={styles.companyDesc}>
                        {comp.description}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.companyBtn}
                      onPress={() =>
                        router.push({
                          pathname: '/companies/[id]',
                          params: { id: comp.id },
                        })
                      }
                    >
                      <Text style={styles.companyBtnText}>Ver empresa</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  whiteBox: {
    marginTop: 10,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    width: '100%',
  },
  whiteBox2: {
    flex: 1, 
    marginTop: 10,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    width: '100%',
    marginBottom: 120,
    justifyContent: 'center',
    alignItems: 'center',  
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 20,
    color: '#666',
    textAlign: 'center',
    width: '80%',
  },
  linkText: {
    color: '#FFA600',
    marginTop: 8,
  },
  catWrapper: {
    width: 90,
    alignItems: 'center',
  },
  catImageWrapper: {
    width: 80,
    height: 80,
    padding: 15,
    backgroundColor: '#F0F0F0',
    borderColor: '#D9D9D9',
    borderWidth: 1,
    borderRadius: 40,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusSign: {
    fontSize: 40,
    color: '#000',
    textAlign: 'center',
    marginTop: -5,
  },
  catName: {
    marginTop: 8,
    textAlign: 'center',
    color: '#000',
  },
  companyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    padding: 12,
  },
  companyLogo: {
    width: 70,
    height: 70,
    borderRadius: 50,
    marginRight: 12,
    backgroundColor: '#FFA600',
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  companyDesc: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  companyBtn: {
    backgroundColor: '#F0F0F0',
    borderColor: '#D9D9D9',
    borderWidth: 1,
    borderRadius: 50,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addressText: { fontSize: 16, color: '#000' },
  companyBtnText: {
    color: '#000',
    fontWeight: '500',
  },
});

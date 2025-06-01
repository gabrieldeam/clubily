// app/search.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Header from '../../components/Header';
import { searchCompaniesByName } from '../../services/companyService'; // Import the new service
import type { CompanyReadWithService } from '../../types/company';
import { imagePublicBaseUrl } from '../../services/api';
import { SvgUri } from 'react-native-svg';

export default function SearchScreen() {
  const { query } = useLocalSearchParams<{ query: string }>();
  const router = useRouter();

  const [companies, setCompanies] = useState<CompanyReadWithService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      setError('Nenhum termo de busca fornecido.');
      return;
    }

    setLoading(true);
    setError(null);

    searchCompaniesByName(query)
      .then((res) => {
        setCompanies(res.data);
      })
      .catch((err) => {
        console.error('Error fetching search results:', err);
        setError('Erro ao carregar resultados da busca.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [query]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#FFA600" size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header showUser={false} />

      {/* Header for search results */}
      <View style={styles.searchHeader}>
        <Text style={styles.searchText}>
          Resultados para "{query}"
        </Text>
      </View>

      {/* White box containing the list of companies */}
      <View style={styles.whiteBox}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {companies.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhuma empresa encontrada para "{query}".</Text>
            </View>
          ) : (
            companies.map((comp) => {
              const logoUri = `${imagePublicBaseUrl}${comp.logo_url || ''}`;
              const isSvg = comp.logo_url?.toLowerCase().endsWith('.svg');

              return (
                <View key={String(comp.id)} style={styles.companyCard}>
                  {comp.logo_url &&
                    (isSvg ? (
                      <View style={styles.companyLogoWrapper}>
                        <SvgUri uri={logoUri} width="100%" height="100%" />
                      </View>
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
                    ))}

                  <View style={styles.companyInfo}>
                    <Text style={styles.companyName}>{comp.name}</Text>
                    {comp.description && (
                      <Text style={styles.companyDesc} numberOfLines={2}>
                        {comp.description}
                      </Text>
                    )}
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
              );
            })
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Container general
  container: {
    flex: 1,
    backgroundColor: '#000', // Dark background behind the whiteBox
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    paddingHorizontal: 16,
    fontSize: 16,
  },
  searchHeader: {
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    width: '100%',
    marginTop: 10,
  },
  searchText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  // White box that wraps the companies
  whiteBox: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    width: '100%',
    marginTop: 10,
    marginBottom: 120,
  },
  scrollContent: {
    paddingBottom: 10, // Ensures spacing at the end of the list
  },
  companyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10, // 10 gap between each card
  },
  // Round wrapper for SVG
  companyLogoWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F0F0F0',
    marginRight: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // If PNG/JPG, use this style
  companyLogo: {
    width: 70,
    height: 70,
    borderRadius: 35,
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
  companyBtnText: {
    color: '#000',
    fontWeight: '500',
  },
  // If no companies are found
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
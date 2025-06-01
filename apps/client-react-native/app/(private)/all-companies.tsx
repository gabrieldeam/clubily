import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getMyCompanies } from '../../services/userService';
import type { CompanyRead } from '../../types/company';
import { imagePublicBaseUrl } from '../../services/api';
import Header from '../../components/Header';

const ITEMS_PER_PAGE = 10;

const CompanyListItem = ({
  item,
  onPress,
}: {
  item: CompanyRead;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.companyCard} onPress={onPress}>
    <View style={styles.companyLogoWrapper}>
      {item.logo_url ? (
        <Image
          source={{ uri: `${imagePublicBaseUrl}${item.logo_url}` }}
          style={styles.companyLogo}
          resizeMode="cover"
        />
      ) : (
        <Text style={styles.companyLogoFallback}>
          {item.name?.substring(0, 1).toUpperCase() || 'C'}
        </Text>
      )}
    </View>

    <View style={styles.companyInfo}>
      <Text style={styles.companyName}>{item.name}</Text>
      {item.description && (
        <Text style={styles.companyDesc} numberOfLines={2}>
          {item.description}
        </Text>
      )}
    </View>

    <TouchableOpacity style={styles.companyBtn} onPress={onPress}>
      <Text style={styles.companyBtnText}>Ver empresa</Text>
    </TouchableOpacity>
  </TouchableOpacity>
);

export default function AllCompaniesScreen() {
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyRead[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);

  const fetchCompanies = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getMyCompanies(page, ITEMS_PER_PAGE);

      if (response && response.data) {
        setCompanies(response.data);
        setHasNextPage(response.data.length === ITEMS_PER_PAGE);
      } else {
        setCompanies([]);
        setHasNextPage(false);
      }
    } catch (err) {
      console.error('Failed to fetch companies:', err);
      setError('Não foi possível carregar as empresas. Tente novamente.');
      Alert.alert('Erro', 'Não foi possível carregar as empresas.');
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies(currentPage);
  }, [currentPage, fetchCompanies]);

  const handleNextPage = () => {
    if (hasNextPage && !loading) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1 && !loading) {
      setCurrentPage((prevPage) => prevPage - 1);
    }
  };

  const handleCompanyPress = (companyId: string) => {
    console.log('View company details:', companyId);
    // Aqui você pode navegar para a tela de detalhes, por exemplo:
    // router.push(`/company/${companyId}`);
  };

  if (isInitialLoad && loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      
        <View style={styles.whiteBox}>
          {error && !loading && (
            <View style={styles.centeredMessage}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => fetchCompanies(currentPage)}
              >
                <Text style={styles.retryButtonText}>Tentar Novamente</Text>
              </TouchableOpacity>
            </View>
          )}

          {!error &&
            (companies.length === 0 && !loading ? (
              <View style={styles.centeredMessage}>
                <Text style={styles.noDataText}>Nenhuma empresa encontrada.</Text>
              </View>
            ) : (
              <FlatList
                data={companies}
                renderItem={({ item }) => (
                  <CompanyListItem
                    item={item}
                    onPress={() => handleCompanyPress(item.id)}
                  />
                )}
                keyExtractor={(item) => item.id}                
                ListFooterComponent={
                  loading && !isInitialLoad ? (
                    <ActivityIndicator
                      style={{ marginVertical: 20 }}
                      size="small"
                      color="#007AFF"
                    />
                  ) : null
                }
              />
            ))}
        </View>

        {!error && companies.length > 0 && (
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              style={[styles.pageButton, currentPage === 1 && styles.disabledButton]}
              onPress={handlePreviousPage}
              disabled={currentPage === 1 || loading}
            >
              <Text style={styles.pageButtonText}>Anterior</Text>
            </TouchableOpacity>
            <Text style={styles.pageInfoText}>Página {currentPage}</Text>
            <TouchableOpacity
              style={[styles.pageButton, !hasNextPage && styles.disabledButton]}
              onPress={handleNextPage}
              disabled={!hasNextPage || loading}
            >
              <Text style={styles.pageButtonText}>Próxima</Text>
            </TouchableOpacity>
          </View>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',    
    paddingBottom: 120,
  },
  whiteBox: {
    marginTop: 10,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    width: '100%',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  companyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
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
  companyLogo: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFA600',
  },
  companyLogoFallback: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#A0A0A0',
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
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  pageButton: {
    backgroundColor: '#FFA600',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  pageButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: '#FFC353',
  },
  pageInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFC353',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 10,
  },
  noDataText: {
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
    fontSize: 16,
  },
  retryButton: {
    marginTop: 15,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

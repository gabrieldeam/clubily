import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import Header from '../components/Header';
import FloatingMenu from '../components/FloatingMenu';
import { useAuth } from '../context/AuthContext';
import { useAddress } from '../context/AddressContext';
import { listUsedCategories } from '../services/categoryService';
import { imagePublicBaseUrl } from '../services/api';
import { SvgUri } from 'react-native-svg';
import type { CategoryRead, CategoryFilter } from '../types/category';

export default function HomeScreen() {
  const { user } = useAuth();
  const { selectedAddress, filterField } = useAddress();

  const [categories, setCategories] = useState<CategoryRead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildFilters = (): CategoryFilter => {
    const filters: CategoryFilter = {};
    if (!selectedAddress) return filters;
    if (filterField === 'city') filters.city = selectedAddress.city;
    else if (filterField === 'postal_code') filters.postal_code = selectedAddress.postal_code;
    return filters;
  };

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await listUsedCategories(buildFilters());
        setCategories(res.data);
      } catch {
        setError('Erro ao carregar categorias');
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, [selectedAddress, filterField]);

  return (
    <View style={styles.container}>
      <Header
        showUser
        userName={user?.name}
        onAddressPress={() => {/* abrir seletor de endereço */}}
        onSearch={query => {/* usar query */}}
      />

      <View style={styles.whiteBox}>
        <Text style={styles.title}>Categorias</Text>
        {loading ? (
          <ActivityIndicator color="#FFA600" />
        ) : categories.length > 0 ? (
          <View style={styles.grid}>
            {categories.map(cat => {
              const uri = `${imagePublicBaseUrl}${cat.image_url}`;
              return (
                <View key={cat.id} style={styles.catItem}>
                  <View style={styles.catImageWrapper}>
                    <SvgUri uri={uri} width="100%" height="100%" />
                  </View>
                  <Text style={styles.catName}>{cat.name}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Não há nada na sua região</Text>
          </View>
        )}
      </View>

      <FloatingMenu />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  whiteBox: {
    marginTop: 10,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',  // alinha itens à esquerda
  },
  catItem: {
    width: '48%',
    marginBottom: 16,
    marginRight: 8,  // espaçamento entre colunas
    alignItems: 'center',
  },
  catImageWrapper: {
    width: 80,
    height: 80,
    padding: 15,  // padding interno
    backgroundColor: '#F0F0F0',
    borderColor: '#D9D9D9',
    borderWidth: 1,
    borderRadius: 40,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  catName: {
    marginTop: 8,
    textAlign: 'center',
    color: '#000',
  },
  emptyContainer: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: { color: '#666' },
});

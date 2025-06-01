// app/categories/index.tsx
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
import { useRouter } from 'expo-router';
import Header from '../../components/Header';
import { listUsedCategories } from '../../services/categoryService';
import type { CategoryRead } from '../../types/category';
import { imagePublicBaseUrl } from '../../services/api';
import { SvgUri } from 'react-native-svg';
import { useAddress } from '../../context/AddressContext'; 

export default function CategoriesScreen() {
  const router = useRouter();

  const [categories, setCategories] = useState<CategoryRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedAddress, filterField } = useAddress();

  const buildFilters = (): Record<string, string> => {
    if (
      selectedAddress &&
      filterField in selectedAddress &&
      typeof selectedAddress[filterField] === 'string'
    ) {
      // exemplo: se filterField === 'city', então usamos selectedAddress.city
      return { [filterField]: (selectedAddress as any)[filterField] };
    }
    return {};
  };

  /* ─────────── carregamento ─────────── */
  useEffect(() => {
    setLoading(true);
    setError(null);
    const filtros = buildFilters();
    listUsedCategories(filtros)
      .then(res => {
        setCategories(res.data);
      })
      .catch(() => {
        setError('Erro ao carregar categorias.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedAddress, filterField]);

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
      {/* header */}
      <Header showUser={false} />

      {/* lista dentro da “whiteBox” */}
      <View style={styles.whiteBox}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {categories.map(cat => {
            const logoUri = `${imagePublicBaseUrl}${cat.image_url || ''}`;
            const isSvg = cat.image_url?.toLowerCase().endsWith('.svg');

            return (
              <View key={String(cat.id)} style={styles.categoryCard}>
                {/* logo */}
                {cat.image_url && (
                  isSvg ? (
                    <View style={styles.categoryLogoWrapper}>
                      <SvgUri uri={logoUri} width="100%" height="100%" />
                    </View>
                  ) : (
                    <View style={styles.categoryLogoWrapper}>
                      <Image
                        source={{ uri: logoUri }}
                        style={styles.categoryImage}
                        resizeMode="contain"
                      />
                    </View>
                  )
                )}

                {/* nome */}
                <Text style={styles.categoryTitle}>{cat.name}</Text>

                {/* botão “ver mais…” */}
                <TouchableOpacity
                  style={styles.categoryBtn}
                  onPress={() =>
                    router.push({
                      pathname: '/categories/[id]',
                      params: { id: cat.id },
                    })
                  }
                >
                  <Text style={styles.categoryBtnText}>Ver mais…</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

/* ─────────── estilos ─────────── */
const styles = StyleSheet.create({
  /* “fundão” preto */
  container: {
    flex: 1,
    backgroundColor: '#000',
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

  /* caixa branca que envolve a lista */
  whiteBox: {
    borderRadius: 20,
    width: '100%',
    marginTop: 10,
    marginBottom: 120,
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 10,
  },

  /* cada linha da categoria */
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 12,
    marginBottom: 10,
  },

  /* bolinha do logo */
  categoryLogoWrapper: {
    width: 60,
    height: 60,
    backgroundColor: '#F0F0F0',
    borderColor: '#D9D9D9',
    borderWidth: 1,
    borderRadius: 40,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10, 
    marginRight: 10,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  categoryImage: {
  width: 30, 
  height: 30, 
},

  /* botão alinhado à direita */
  categoryBtn: {
    marginLeft: 'auto',
    backgroundColor: '#F0F0F0',
    borderColor: '#D9D9D9',
    borderWidth: 1,
    borderRadius: 50,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryBtnText: {
    color: '#000',
    fontWeight: '500',
  },
});

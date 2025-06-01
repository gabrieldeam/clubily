// app/categories/[id].tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  TouchableOpacity
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Header from '../../../components/Header';
import { searchCompaniesByCategory } from '../../../services/companyService';
import { getCategoryById } from '../../../services/categoryService'; // import do serviço de categoria
import type { CompanyRead } from '../../../types/company';
import type { CategoryRead } from '../../../types/category'; // import do tipo CategoryRead
import { imagePublicBaseUrl } from '../../../services/api';
import { SvgUri } from 'react-native-svg';

export default function CategoryScreen() {
  // 1. Captura o "id" da rota: /categories/123
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // 2. Estados para lista de empresas e para a própria categoria
  const [companies, setCompanies] = useState<CompanyRead[]>([]);
  const [category, setCategory] = useState<CategoryRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError(null);

    // 3. Busca categoria e lista de empresas que pertencem a esta categoria
    Promise.all([
      getCategoryById(id),
      searchCompaniesByCategory(id)
    ])
      .then(([catRes, compRes]) => {
        setCategory(catRes.data);
        setCompanies(compRes.data);
      })
      .catch(() => {
        setError(prev => (prev ? prev + '\n' : '') + 'Erro ao carregar dados da categoria ou empresas.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  // 4. Estado de carregando
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#FFA600" size="large" />
      </View>
    );
  }

  // 5. Caso tenha erro, exibe mensagem
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // 6. Se não houver categoria (por segurança), retorna null
  if (!category) {
    return null;
  }

  // 7. Monta URI da imagem da categoria e verifica se é SVG
  const categoryLogoUri = `${imagePublicBaseUrl}${category.image_url || ''}`;
  const isSvgCategory = category.image_url?.toLowerCase().endsWith('.svg');

  return (
    <View style={styles.container}>
      {/* Header sem mostrar usuário */}
      <Header showUser={false} />

      {/* Exibe a imagem da categoria em círculo e o nome ao lado */}
      <View style={styles.categoryHeader}>
        {category.image_url && (
          isSvgCategory ? (
            <View style={styles.categoryLogoWrapper}>
              <SvgUri
                uri={categoryLogoUri}
                width="100%"
                height="100%"
              />
            </View>
          ) : (
            <View style={styles.categoryLogoWrapper}>
            <Image
              source={{ uri: categoryLogoUri }}
              style={styles.categoryImage}
              resizeMode="contain"
              onError={e =>
                console.warn(
                  'Erro ao carregar logo da categoria:',
                  e.nativeEvent.error
                )
              }
            />
          </View>
          )
        )}

        <Text style={styles.categoryTitle}>{category.name}</Text>
        <TouchableOpacity
          style={styles.categoryBtn}
          onPress={() => router.push('/categories')}
        >
          <Text style={styles.categoryBtnText}>Ver todas</Text>
        </TouchableOpacity>
      </View>

      {/* Caixa branca contendo a lista de empresas */}
      <View style={styles.whiteBox}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {companies.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhuma empresa encontrada.</Text>
            </View>
          ) : (
            companies.map(comp => {
              // Determina se é SVG pelo sufixo da URL
              const logoUri = `${imagePublicBaseUrl}${comp.logo_url || ''}`;
              const isSvg = comp.logo_url?.toLowerCase().endsWith('.svg');

              return (
                <View key={String(comp.id)} style={styles.companyCard}>
                  {/* Logo da empresa (SVG ou PNG/JPG) */}
                  {comp.logo_url && (
                    isSvg ? (
                      <View style={styles.companyLogoWrapper}>
                        <SvgUri
                          uri={logoUri}
                          width="100%"
                          height="100%"
                        />
                      </View>
                    ) : (
                      <Image
                        source={{ uri: logoUri }}
                        style={styles.companyLogo}
                        onError={e =>
                          console.warn(
                            'Erro ao carregar logo PNG/JPG:',
                            e.nativeEvent.error
                          )
                        }
                      />
                    )
                  )}

                  <View style={styles.companyInfo}>
                    <Text style={styles.companyName}>{comp.name}</Text>
                    {comp.description && (
                      <Text style={styles.companyDesc} numberOfLines={2}>
                        {comp.description}
                      </Text>
                    )}
                  </View>

                  {/* Botão “Ver empresa” */}
                  <TouchableOpacity
                    style={styles.companyBtn}
                    onPress={() =>
                      router.push({
                        pathname: '/companies/[id]',
                        params: { id: comp.id }
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
  // Container geral
  container: {
    flex: 1,
    backgroundColor: '#000', // fundo escuro atrás da whiteBox
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    paddingHorizontal: 16,
    fontSize: 16
  },

  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    width: '100%',
    marginTop: 10,
  },

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

  // Caixa branca que envolve as empresas
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
    paddingBottom: 10, // garante espaçamento no fim da lista
  },

  companyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10, // gap de 10 entre cada card
  },
  // Wrapper redondo para SVG
  companyLogoWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F0F0F0',
    marginRight: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center'
  },
  // Se for PNG/JPG, usar esse estilo
  companyLogo: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 12,
    backgroundColor: '#FFA600'
  },
  companyInfo: {
    flex: 1
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000'
  },
  companyDesc: {
    fontSize: 14,
    color: '#333',
    marginTop: 4
  },
  companyBtn: {
    backgroundColor: '#F0F0F0',
    borderColor: '#D9D9D9',
    borderWidth: 1,
    borderRadius: 50,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  companyBtnText: {
    color: '#000',
    fontWeight: '500'
  },

  // Caso não haja nenhuma empresa
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40
  },
  emptyText: {
    fontSize: 16,
    color: '#666'
  },
  categoryBtn: {
  backgroundColor: '#F0F0F0',
  borderColor: '#D9D9D9',
  borderWidth: 1,
  borderRadius: 50,
  paddingHorizontal: 12,
  paddingVertical: 6,
  marginLeft: 'auto',      // empurra para a direita
},

categoryBtnText: {
  color: '#000',
  fontWeight: '500',
},
});

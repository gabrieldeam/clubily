// app/(private)/cashbacks.tsx
import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  FlatList,
  TouchableOpacity,
} from 'react-native'
import { useRouter } from 'expo-router'
import Header from '../../components/Header'
import MapNull from '../../assets/icons/mapNull.svg'
import {
  getCompaniesWithCashback,
  getCashbacks,
  getCashbacksByCompany,
} from '../../services/cashbackService'
import type {
  UserCashbackCompany,
  CashbackRead,
  PaginatedCashbacks,
} from '../../types/cashback'
import { imagePublicBaseUrl } from '../../services/api'

export default function CashbacksScreen() {
  const router = useRouter()

  // empresas
  const [companies, setCompanies] = useState<UserCashbackCompany[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)

  // cashbacks
  const [cashbacks, setCashbacks] = useState<PaginatedCashbacks | null>(null)
  const [page, setPage] = useState(1)
  const cbLimit = 10
  const [loadingCashbacks, setLoadingCashbacks] = useState(false)

  // filtro por empresa
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)

  // carrega empresas (lista simples)
  useEffect(() => {
    setLoadingCompanies(true)
    getCompaniesWithCashback()
      .then(list => setCompanies(list))
      .catch(() => setCompanies([]))
      .finally(() => setLoadingCompanies(false))
  }, [])

  // busca cashbacks (genéricos ou por empresa)
  const fetchCashbacks = async () => {
    setLoadingCashbacks(true)
    try {
      const skip = (page - 1) * cbLimit

      if (selectedCompany) {
        const items = await getCashbacksByCompany(
          selectedCompany,
          skip,
          cbLimit
        )
        setCashbacks({
          total: items.length,
          skip,
          limit: cbLimit,
          items,
        })
      } else {
        const pag = await getCashbacks(skip, cbLimit)
        setCashbacks(pag)
      }
    } finally {
      setLoadingCashbacks(false)
    }
  }

  useEffect(() => {
    fetchCashbacks()
  }, [page, selectedCompany])

  const hasMore =
    cashbacks != null && cashbacks.skip + cashbacks.limit < cashbacks.total

  return (
    <View style={styles.container}>
      <Header showUser={false} />

      {/* Empresas (scroll horizontal) */}
      <View style={styles.section}>
        {loadingCompanies ? (
          <ActivityIndicator color="#FFA600" />
        ) : (
          <FlatList<UserCashbackCompany>
            data={companies}
            horizontal
            keyExtractor={c => c.company_id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.companiesScroll}
            renderItem={({ item }) => {
              const isActive = selectedCompany === item.company_id
              return (
                <TouchableOpacity
                  style={[
                    styles.companyItem,
                    isActive && styles.companyItemActive,
                  ]}
                  onPress={() => {
                    const next = isActive ? null : item.company_id
                    setSelectedCompany(next)
                    setPage(1)
                  }}
                >
                  {item.logo_url ? (
                    <Image
                      source={{
                        uri: `${imagePublicBaseUrl}${item.logo_url}`,
                      }}
                      style={styles.companyLogo}
                    />
                  ) : (
                    <View style={styles.companyLogoFallback}>
                      <Text style={styles.companyLogoText}>
                        {item.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.companyName}>{item.name}</Text>
                </TouchableOpacity>
              )
            }}
          />
        )}
      </View>

      {/* Cashbacks + paginação */}
      <View style={styles.section}>
        {loadingCashbacks ? (
          <ActivityIndicator color="#FFA600" />
        ) : !cashbacks?.items.length ? (
          <View style={styles.emptyContainer}>
            <MapNull width={120} height={120} />
            <Text style={styles.emptyText}>Nenhum cashback encontrado.</Text>
          </View>
        ) : (
          <>
            <FlatList<CashbackRead>
              data={cashbacks.items}
              keyExtractor={cb => cb.id}
              contentContainerStyle={styles.cashbacksList}
              renderItem={({ item }) => (
                <View style={styles.cashbackItem}>
                  <TouchableOpacity
                    style={styles.cashbackCompany}
                    onPress={() =>
                      router.push({
                        pathname: '/companies/[id]',
                        params: { id: item.program.company_id },
                      })
                    }
                  >
                    {item.company_logo_url ? (
                      <Image
                        source={{
                          uri: `${imagePublicBaseUrl}${item.company_logo_url}`,
                        }}
                        style={styles.companyLogo}
                      />
                    ) : (
                      <View style={styles.companyLogoFallback}>
                        <Text style={styles.companyLogoText}>
                          {item.company_name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.companyNameItem}>
                      {item.company_name}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.cashbackDetails}>
                    <Text>
                      <Text style={styles.label}>Valor: </Text>
                      {item.cashback_value.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </Text>
                    <Text>
                      <Text style={styles.label}>Recebido em: </Text>
                      {new Date(item.assigned_at).toLocaleDateString(
                        'pt-BR'
                      )}
                    </Text>
                    <Text>
                      <Text style={styles.label}>Expira em: </Text>
                      {new Date(item.expires_at).toLocaleDateString('pt-BR')}
                    </Text>
                  </View>
                </View>
              )}
            />

            <View style={styles.pagination}>
              <TouchableOpacity
                disabled={page === 1}
                onPress={() => setPage(p => p - 1)}
                style={[
                  styles.pageBtn,
                  page === 1 && styles.pageBtnDisabled,
                ]}
              >
                <Text>Anterior</Text>
              </TouchableOpacity>
              <Text style={styles.pageNumber}>Página {page}</Text>
              <TouchableOpacity
                disabled={!hasMore}
                onPress={() => setPage(p => p + 1)}
                style={[
                  styles.pageBtn,
                  !hasMore && styles.pageBtnDisabled,
                ]}
              >
                <Text>Próxima</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    marginTop: 10,
    maxHeight: '61%',
  },

  /* horizontal scroll de empresas */
  companiesScroll: { paddingVertical: 8 },
  companyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 50,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  companyItemActive: {
    backgroundColor: '#FFA60022',
    borderColor: '#FFA600',
    borderWidth: 1,
  },
  companyLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#FFA600',
  },
  companyLogoFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFA600',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  companyLogoText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  companyName: {
    fontSize: 14,
    maxWidth: 80,
  },

  /* lista de cashbacks */
  cashbacksList: { paddingBottom: 8 },
  cashbackItem: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cashbackCompany: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  companyNameItem: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  cashbackDetails: {
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 8,
  },
  label: { fontWeight: '600' },

  /* empty state */
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: { fontSize: 16, color: '#666', marginTop: 8 },

  /* paginação */
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  pageBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    marginHorizontal: 8,
  },
  pageBtnDisabled: { opacity: 0.4 },
  pageNumber: { fontWeight: '600' },
})

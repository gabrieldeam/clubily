// apps/client-react-native/app/(private)/profile.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  FlatList,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import Edite from '../../assets/icons/edit.svg';
import Arrow from '../../assets/icons/arrow.svg';
import ArrowRed from '../../assets/icons/ArrowRed.svg';

import EditUserModal from '../../components/EditUserModal';
import { getMyCompanies, requestUserDeletion } from '../../services/userService';
import type { CompanyRead } from '../../types/company';
import { imagePublicBaseUrl } from '../../services/api';

export default function ProfileScreen() {
  const { user, loading: authLoading, logout, refreshUser } = useAuth();
  const router = useRouter();

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  // State for companies
  const [myCompanies, setMyCompanies] = useState<CompanyRead[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState<boolean>(false);
  const [companiesError, setCompaniesError] = useState<string | null>(null);

  // Novo estado para controlar passo de exclusão da conta
  // 0 = estado inicial (mostrar “Deletar conta”)
  // 1 = aguardando confirmação (“Confirmar exclusão da conta”)
  // 2 = exclusão concluída com sucesso (mostrar mensagem final)
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (user) {
      const fetchCompanies = async () => {
        setLoadingCompanies(true);
        setCompaniesError(null);
        try {
          const response = await getMyCompanies(1, 10);
          setMyCompanies(response.data);
        } catch (error) {
          console.error('Failed to fetch companies:', error);
          setCompaniesError('Não foi possível carregar suas empresas.');
        } finally {
          setLoadingCompanies(false);
        }
      };
      fetchCompanies();
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const handleAboutUs = () => Linking.openURL('https://clubi.ly/about');
  const handlePrivacyPolicy = () => router.push('/policies/privacy');
  const handleTermsOfUse = () => router.push('/policies/terms');
  const handleChatSupport = () => Linking.openURL('https://clubi.ly/help/chat');
  const handleEmailSupport = () => Linking.openURL('mailto:support@clubi.ly?subject=Suporte%20ao%20Usuário');
  const handleOpenEditModal = () => setIsEditModalVisible(true);
  const handleCloseEditModal = () => setIsEditModalVisible(false);
  const handleUserSuccessfullyUpdated = async () => {
    await refreshUser();
    setIsEditModalVisible(false);
  };

  const renderCompanyCard = ({ item }: { item: CompanyRead }) => (
    <View style={styles.companyCard}>
      <View style={styles.companyLogoWrapper}>
        {item.logo_url ? (
          <Image
            source={{ uri: `${imagePublicBaseUrl}${item.logo_url}` }}
            style={styles.companyLogoImage}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.companyLogoFallbackText}>
            {item.name?.substring(0, 1).toUpperCase() || 'C'}
          </Text>
        )}
      </View>
      <Text style={styles.companyNameCard} numberOfLines={2}>
        {item.name}
      </Text>
      <TouchableOpacity
        style={styles.viewCompanyButton}
        onPress={() => {
          console.log('Ver empresa:', item.id);
        }}
      >
        <Text style={styles.viewCompanyButtonText}>Ver empresa</Text>
      </TouchableOpacity>
    </View>
  );

  const handleSeeAllCompanies = () => {
    router.push('/all-companies');
  };

  // Função chamada ao clicar no botão “Deletar conta” ou “Confirmar exclusão da conta”
  const handleDeleteAccountPress = async () => {
    if (deleteStep === 0) {
      // Passo 1: apenas altera estado para mostrar confirmação
      setDeleteStep(1);
    } else if (deleteStep === 1) {
      // Passo 2: chama endpoint de solicitação de exclusão
      setDeleteLoading(true);
      try {
        const res = await requestUserDeletion();
        // Se bem-sucedido:
        setDeleteStep(2);
      } catch (err: any) {
        console.error('Erro ao solicitar exclusão:', err);
        // Se falhar, alerta indicando usar o botão de email em Ajuda
        Alert.alert(
          'Erro',
          'Não foi possível solicitar exclusão. Por favor, envie um email através do botão “Email” na seção de Ajuda.'
        );
        // Voltamos para o estado inicial
        setDeleteStep(0);
      } finally {
        setDeleteLoading(false);
      }
    }
  };

  if (authLoading && !user) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {user ? (
          <>
            <View style={styles.whiteBox}>
              <View style={styles.nameRow}>
                <Text style={styles.nameText}>{user.name}</Text>
                <TouchableOpacity onPress={handleOpenEditModal}>
                  <Edite width={24} height={24} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.whiteBox}>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>E-mail</Text>
                <Text style={styles.fieldValue}>{user.email}</Text>
              </View>
              {user.phone && (
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Telefone</Text>
                  <Text style={styles.fieldValue}>{user.phone}</Text>
                </View>
              )}
            </View>

            {/* START: My Companies Section */}
            <View style={styles.whiteBox}>
              <View style={styles.sectionHeaderContainer}>
                <Text style={styles.sectionHeader}>Empresas cadastro</Text>
                {myCompanies.length > 0 && (
                  <TouchableOpacity onPress={handleSeeAllCompanies} style={styles.seeAllButton}>
                    <Text style={styles.seeAllButtonText}>Ver todas</Text>
                  </TouchableOpacity>
                )}
              </View>
              {loadingCompanies ? (
                <ActivityIndicator size="large" color="#000000" style={{ marginVertical: 20 }} />
              ) : companiesError ? (
                <Text style={styles.errorText}>{companiesError}</Text>
              ) : myCompanies.length > 0 ? (
                <FlatList
                  data={myCompanies.slice(0, 4)}
                  renderItem={renderCompanyCard}
                  keyExtractor={(item) => item.id}
                  numColumns={2}
                  columnWrapperStyle={styles.companyRow}
                  scrollEnabled={false}
                />
              ) : (
                <Text style={styles.noDataText}>Você ainda não está associado a nenhuma empresa.</Text>
              )}
            </View>
            {/* END: My Companies Section */}

            {/* Botão de Deletar Conta / Confirmar Exclusão / Mensagem Final */}
            <View style={styles.whiteBox}>
              {deleteStep === 0 && (
                <TouchableOpacity
                  onPress={handleDeleteAccountPress}
                  style={styles.logoutButtonGeneric}
                  disabled={deleteLoading}
                >
                  <Text style={styles.DeletButtonText}>Deletar conta</Text>
                  <ArrowRed width={20} height={20} />
                </TouchableOpacity>
              )}

              {deleteStep === 1 && (
                <TouchableOpacity
                  onPress={handleDeleteAccountPress}
                  style={styles.logoutButtonGeneric}
                  disabled={deleteLoading}
                >
                  <Text style={styles.DeletButtonText}>Confirmar exclusão da conta</Text>
                  {deleteLoading ? (
                    <ActivityIndicator size="small" color="#FF0000" />
                  ) : (
                    <ArrowRed width={20} height={20} />
                  )}
                </TouchableOpacity>
              )}

              {deleteStep === 2 && (
                <View style={styles.finalMessageContainer}>
                  <Text style={styles.finalMessageText}>
                    Em breve você irá receber um email sobre
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.whiteBox}>
              <View style={styles.helpRow}>
                <Text style={styles.fieldLabel}>Ajuda</Text>
                <View style={styles.helpButtonsContainer}>
                  <TouchableOpacity onPress={handleChatSupport} style={styles.supportCompanyBtn}>
                    <Text style={styles.supportCompanyBtnText}>Chat</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleEmailSupport} style={styles.supportCompanyBtn}>
                    <Text style={styles.supportCompanyBtnText}>Email</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.whiteBox}>
              <TouchableOpacity onPress={handleAboutUs} style={styles.logoutButtonGeneric}>
                <Text style={styles.logoutButtonText}>Sobre nós</Text>
                <Arrow width={20} height={20} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handlePrivacyPolicy} style={styles.logoutButtonGeneric}>
                <Text style={styles.logoutButtonText}>Política de privacidade</Text>
                <Arrow width={20} height={20} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleTermsOfUse} style={styles.logoutButtonGeneric}>
                <Text style={styles.logoutButtonText}>Termo de uso</Text>
                <Arrow width={20} height={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.whiteBox}>
              <TouchableOpacity onPress={handleLogout} style={styles.logoutButtonGeneric}>
                <Text style={styles.logoutButtonText}>Sair</Text>
                <Arrow width={20} height={20} />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <Text style={styles.notLoggedText}>Nenhum usuário logado.</Text>
        )}
      </ScrollView>

      {user && (
        <EditUserModal
          visible={isEditModalVisible}
          onClose={handleCloseEditModal}
          onUserUpdated={handleUserSuccessfullyUpdated}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    justifyContent: 'center',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 120,
  },
  whiteBox: {
    marginTop: 10,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    width: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameText: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#000',
    flexShrink: 1,
    marginRight: 8,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 4,
  },
  fieldLabel: {
    fontWeight: '600',
    color: '#000',
    fontSize: 16,
  },
  fieldValue: {
    color: '#878787',
    fontSize: 16,
    textAlign: 'right',
    flexShrink: 1,
    marginLeft: 8,
  },
  logoutButtonGeneric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 12,
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#000',
  },
  DeletButtonText: {
    fontSize: 16,
    color: '#FF0000',
    fontWeight: '600',
  },
  notLoggedText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 32,
  },
  helpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 4,
  },
  helpButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  supportCompanyBtn: {
    backgroundColor: '#F0F0F0',
    borderColor: '#D9D9D9',
    borderWidth: 1,
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  supportCompanyBtnText: {
    color: '#000',
    fontWeight: '500',
    fontSize: 14,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seeAllButton: {
    paddingVertical: 4,
    marginTop: -10,
  },
  seeAllButtonText: {
    fontSize: 14,
    color: '#FF4C00',
    fontWeight: '600',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 10,
  },
  noDataText: {
    color: '#666666',
    textAlign: 'center',
    marginVertical: 10,
    fontStyle: 'italic',
  },
  companyRow: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  companyCard: {
    width: '48.5%',
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  companyLogoWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F0F0F0',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  companyLogoImage: {
    width: 70,
    height: 70,
    backgroundColor: '#FFA600',
  },
  companyLogoFallbackText: {
    fontSize: 28,
    color: '#A0A0A0',
    fontWeight: 'bold',
  },
  companyNameCard: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 10,
    minHeight: 38,
  },
  viewCompanyButton: {
    backgroundColor: '#F0F0F0',
    borderColor: '#D9D9D9',
    borderWidth: 1,
    borderRadius: 50,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  viewCompanyButtonText: {
    color: '#000',
    fontWeight: '500',
    fontSize: 14,
  },
  finalMessageContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finalMessageText: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
  },
});

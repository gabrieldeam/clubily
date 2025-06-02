// apps/client-react-native/app/(private)/profile.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { SvgUri } from 'react-native-svg';
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

  const [myCompanies, setMyCompanies] = useState<CompanyRead[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState<boolean>(false);
  const [companiesError, setCompaniesError] = useState<string | null>(null);

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
  const handleEmailSupport = () =>
    Linking.openURL('mailto:support@clubi.ly?subject=Suporte%20ao%20Usuário');
  const handleOpenEditModal = () => setIsEditModalVisible(true);
  const handleCloseEditModal = () => setIsEditModalVisible(false);
  const handleUserSuccessfullyUpdated = async () => {
    await refreshUser();
    setIsEditModalVisible(false);
  };

  const handleSeeAllCompanies = () => {
    router.push('/all-companies');
  };

  const handleDeleteAccountPress = async () => {
    if (deleteStep === 0) {
      setDeleteStep(1);
    } else if (deleteStep === 1) {
      setDeleteLoading(true);
      try {
        await requestUserDeletion();
        setDeleteStep(2);
      } catch (err: any) {
        console.error('Erro ao solicitar exclusão:', err);
        Alert.alert(
          'Erro',
          'Não foi possível solicitar exclusão. Por favor, envie um email através do botão “Email” na seção de Ajuda.'
        );
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
            {/* Dados básicos do usuário */}
            <View style={styles.whiteBox}>
              <View style={styles.nameRow}>
                <Text style={styles.nameText}>{user.name}</Text>
                <TouchableOpacity onPress={handleOpenEditModal}>
                  <Edite width={24} height={24} />
                </TouchableOpacity>
              </View>
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

            {/* Seção de empresas */}
            <View style={styles.whiteBox}>
              <Text style={styles.sectionHeader}>Empresas inscritas</Text>

              {loadingCompanies ? (
                <ActivityIndicator
                  size="large"
                  color="#000"
                  style={{ marginVertical: 20 }}
                />
              ) : companiesError ? (
                <Text style={styles.errorText}>{companiesError}</Text>
              ) : myCompanies.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    Você ainda não está associado a nenhuma empresa.
                  </Text>
                </View>
              ) : (
                <>
                  {myCompanies.slice(0, 4).map((comp) => {
                    const logoUri = `${imagePublicBaseUrl}${comp.logo_url || ''}`;
                    const isSvg = comp.logo_url?.toLowerCase().endsWith('.svg');

                    return (
                      <View key={comp.id} style={styles.companyCard}>
                        {/* Logo */}
                        {comp.logo_url && (
                          isSvg ? (
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
                          )
                        )}

                        {/* Informações da empresa */}
                        <View style={styles.companyInfo}>
                          <Text style={styles.companyName}>{comp.name}</Text>
                          {comp.description && (
                            <Text
                              style={styles.companyDesc}
                              numberOfLines={2}
                            >
                              {comp.description}
                            </Text>
                          )}
                        </View>

                        {/* Botão Ver empresa */}
                        <TouchableOpacity
                          style={styles.companyBtn}
                          onPress={() =>
                            router.push({
                              pathname: '/companies/[id]',
                              params: { id: comp.id },
                            })
                          }
                        >
                          <Text style={styles.companyBtnText}>
                            Ver empresa
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}

                  {myCompanies.length > 4 && (
                    <TouchableOpacity
                      style={styles.seeMoreButton}
                      onPress={handleSeeAllCompanies}
                    >
                      <Text style={styles.seeMoreText}>Ver mais</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>

            {/* Botão de Deletar Conta / Confirmar / Mensagem */}
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
                  <Text style={styles.DeletButtonText}>
                    Confirmar exclusão da conta
                  </Text>
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

            {/* Seção de Ajuda */}
            <View style={styles.whiteBox}>
              <View style={styles.helpRow}>
                <Text style={styles.fieldLabel}>Ajuda</Text>
                <View style={styles.helpButtonsContainer}>
                  <TouchableOpacity
                    onPress={handleChatSupport}
                    style={styles.supportCompanyBtn}
                  >
                    <Text style={styles.supportCompanyBtnText}>Chat</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleEmailSupport}
                    style={styles.supportCompanyBtn}
                  >
                    <Text style={styles.supportCompanyBtnText}>Email</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Botão Sobre Nós / Políticas / Sair */}
            <View style={styles.whiteBox}>
              <TouchableOpacity
                onPress={handleAboutUs}
                style={styles.logoutButtonGeneric}
              >
                <Text style={styles.logoutButtonText}>Sobre nós</Text>
                <Arrow width={20} height={20} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePrivacyPolicy}
                style={styles.logoutButtonGeneric}
              >
                <Text style={styles.logoutButtonText}>
                  Política de privacidade
                </Text>
                <Arrow width={20} height={20} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleTermsOfUse}
                style={styles.logoutButtonGeneric}
              >
                <Text style={styles.logoutButtonText}>Termo de uso</Text>
                <Arrow width={20} height={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.whiteBox}>
              <TouchableOpacity
                onPress={handleLogout}
                style={styles.logoutButtonGeneric}
              >
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
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 10,
  },
  emptyContainer: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontStyle: 'italic',
  },

  // ======= NOVOS ESTILOS DE EMPRESA ABAIXO =======
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
  seeMoreButton: {
    marginTop: 8,
    alignSelf: 'center',
  },
  seeMoreText: {
    color: '#FF4C00',
    fontSize: 16,
    fontWeight: '600',
  },

  // ======= RESTANTE DOS ESTILOS =======
  DeletButtonText: {
    fontSize: 16,
    color: '#FF0000',
    fontWeight: '600',
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
  seeAllButton: {
    paddingVertical: 4,
    marginTop: -10,
  },
  seeAllButtonText: {
    fontSize: 14,
    color: '#FF4C00',
    fontWeight: '600',
  },
  notLoggedText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 32,
  },
});

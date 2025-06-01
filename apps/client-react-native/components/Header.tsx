// components/Header.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform, // Import Platform to check OS
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import AddressModal from './AddressModal';
// SVG icons (adicione os arquivos nas paths abaixo)
import Icon from '../assets/icons/icon.svg';
import AddressIcon from '../assets/icons/address.svg';
import SearchIcon from '../assets/icons/search.svg';

interface HeaderProps {
  /** Exibe ou não a saudação com nome de usuário */
  showUser?: boolean;
  /** Nome do usuário para exibir quando showUser=true */
  userName?: string;
  /** Callback ao submeter pesquisa (mantido para compatibilidade, mas a navegação é interna agora) */
  onSearch?: (query: string) => void;
}

export default function Header({
  showUser = false,
  userName = '',
  onSearch,
}: HeaderProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddrModal, setShowAddrModal] = useState(false);
  const router = useRouter();

  const firstName = userName.split(' ')[0] || userName;

  const handleSearchPress = () => setIsSearching(true);
  const handleCancelSearch = () => {
    setIsSearching(false);
    setSearchQuery('');
    // Optionally, if you want to navigate back when canceling search, you could add:
    // if (router.canGoBack()) {
    //   router.back();
    // }
  };

  const submitSearch = () => {
    if (searchQuery.trim()) {
      router.push({
        pathname: '/search',
        params: { query: searchQuery.trim() },
      });
      setIsSearching(false); // Esconde o input de busca após a submissão
      setSearchQuery(''); // Limpa a query de busca
    }
  };

  return (
    <>
      <SafeAreaView edges={['top']} style={styles.header}>
        {isSearching ? (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar..."
              placeholderTextColor="#666"
              autoFocus
              onSubmitEditing={submitSearch}
              // Adicionado para ter o botão de 'Pesquisar' no teclado iOS
              returnKeyType="search"
              // No iOS, permite que o botão de retorno seja automaticamente desabilitado quando o texto estiver vazio
              enablesReturnKeyAutomatically={true}
            />
            <TouchableOpacity onPress={handleCancelSearch} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.headerLeft}>
              <Icon width={40} height={40} />
              {showUser && (
                <View style={styles.userTextContainer}>
                  <Text style={styles.greeting}>Olá,</Text>
                  <Text style={styles.userName}>{firstName}</Text>
                </View>
              )}
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity
                onPress={() => setShowAddrModal(true)}
                style={[styles.iconButton, styles.addressIconButton]}
              >
                <AddressIcon width={24} height={24} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSearchPress} style={styles.iconButton}>
                <SearchIcon width={24} height={24} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </SafeAreaView>

      {/* Modal de seleção de endereço */}
      <AddressModal visible={showAddrModal} onClose={() => setShowAddrModal(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#FFA600',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderRadius: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    color: '#000',
  },
  cancelButton: {
    marginLeft: 12,
  },
  cancelText: {
    color: '#FFF',
    fontSize: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userTextContainer: {
    marginLeft: 12,
  },
  greeting: {
    fontSize: 16,
    marginBottom: -3,
    color: '#FFF',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
  },
  headerRight: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressIconButton: {
    backgroundColor: '#FF4C00',
    width: 36,
    height: 36,
    borderRadius: 18,
  },
});
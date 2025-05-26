// apps/client-react-native/app/(private)/maps.tsx

import React from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import Header from '../../components/Header';
import { Button } from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';

export default function MapsScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };


  return (
    <View style={styles.container}>
      {/* HEADER com SafeArea e busca */}
      
    <Header
      onSearch={query => {/* executa pesquisa */}}
    />

        <View style={styles.content}>
          <Button onPress={handleLogout} style={styles.logoutButton}>
            Sair
          </Button>
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  logoutButton: {
    width: '50%',
  },
});
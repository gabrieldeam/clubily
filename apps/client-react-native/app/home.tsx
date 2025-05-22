// apps/client-react-native/app/home.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <View style={{ flex:1, justifyContent:'center', alignItems:'center', padding:16 }}>
      <Text style={{ fontSize:24, marginBottom:24 }}>Olá, {user?.name}!</Text>
      <Button onPress={handleLogout}>Sair</Button>
    </View>
  );
}

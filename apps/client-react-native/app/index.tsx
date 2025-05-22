// apps/client-react-native/app/index.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { Button } from '../components/Button';
import { useRouter } from 'expo-router';

export default function WelcomeScreen() {
  const router = useRouter();
  return (
    <View style={{ flex:1, justifyContent:'center', alignItems:'center', padding:16 }}>
      <Text style={{ fontSize:24, marginBottom:24 }}>Bem-vindo ao Clubily!</Text>
      <Button onPress={() => router.push('./login')}>Entrar</Button>
      <Button
        onPress={() => router.push('./register')}
        style={{ marginTop:12 }}
      >
        Criar Conta
      </Button>
    </View>
  );
}

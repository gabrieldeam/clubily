// apps/client-react-native/app/policies/privacy.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../components/Button';

export default function PrivacyScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Button onPress={() => router.back()} style={styles.back} bgColor="#DDD" textStyle={{ color: '#000' }}>
        ← Voltar
      </Button>
      <Text style={styles.title}>Política de Privacidade</Text>
      {/* Conteúdo da política aqui */}
      <Text style={styles.content}>Aqui vai a política de privacidade...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  back: { marginBottom: 12, alignSelf: 'flex-start' },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  content: { fontSize: 14, color: '#333' },
});

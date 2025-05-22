// apps/client-react-native/components/LoginForm.tsx
import React, { useState } from 'react';
import { View, TextInput, Alert, StyleSheet } from 'react-native';
import { Button } from './Button';
import { loginUser } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

export default function LoginForm({ onBack }: { onBack?: () => void }) {
  const { refreshUser } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await loginUser({ identifier, password });
      await refreshUser();
      router.replace('/home');
    } catch (err: any) {
      Alert.alert('Falha ao entrar', err?.response?.data?.msg || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {onBack && (
        <Button
          onPress={onBack}
          style={styles.backButton}
          bgColor="#DDD"
          textStyle={{ color: '#000' }}
        >
          ← Voltar
        </Button>
      )}

      <TextInput
        placeholder="Email ou Telefone"
        value={identifier}
        onChangeText={setIdentifier}
        style={styles.input}
      />
      <TextInput
        placeholder="Senha"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      <Button onPress={handleLogin} disabled={loading} style={styles.loginButton}>
        {loading ? 'Entrando...' : 'Entrar'}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // sem height fixo, deixa o conteúdo determinar a altura
  },
  backButton: {
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
  },
  loginButton: {
    marginTop: 8,
  },
});

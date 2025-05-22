// apps/client-react-native/app/login.tsx
import React, { useState } from 'react';
import { View, TextInput, Alert } from 'react-native';
import { Button } from '../components/Button';
import { loginUser } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
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
      router.replace('./home');
    } catch (err: any) {
      Alert.alert('Falha ao entrar', err?.response?.data?.msg || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex:1, justifyContent:'center', padding:16 }}>
      <TextInput
        placeholder="Email ou Telefone"
        value={identifier}
        onChangeText={setIdentifier}
        style={{ borderWidth:1, borderColor:'#ccc', borderRadius:4, padding:8, marginBottom:12 }}
      />
      <TextInput
        placeholder="Senha"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth:1, borderColor:'#ccc', borderRadius:4, padding:8, marginBottom:12 }}
      />
      <Button onPress={handleLogin} disabled={loading}>
        {loading ? 'Entrando...' : 'Entrar'}
      </Button>
    </View>
  );
}

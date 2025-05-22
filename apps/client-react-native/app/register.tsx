// apps/client-react-native/app/register.tsx
import React, { useState } from 'react';
import { View, TextInput, Alert, Switch, Text } from 'react-native';
import { Button } from '../components/Button';
import { registerUser } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

export default function RegisterScreen() {
  const { refreshUser } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!acceptedTerms) {
      Alert.alert('Você deve aceitar os termos');
      return;
    }
    setLoading(true);
    try {
      await registerUser({
        name,
        email: identifier,
        password,
        accepted_terms: true,
      });
      await refreshUser();
      router.replace('./home');
    } catch (err: any) {
      Alert.alert('Falha ao cadastrar', err?.response?.data?.msg || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex:1, padding:16, justifyContent:'center' }}>
      <TextInput
        placeholder="Nome"
        value={name}
        onChangeText={setName}
        style={{ borderWidth:1, borderColor:'#ccc', borderRadius:4, padding:8, marginBottom:12 }}
      />
      <TextInput
        placeholder="Email"
        keyboardType="email-address"
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
      <View style={{ flexDirection:'row', alignItems:'center', marginBottom:12 }}>
        <Switch value={acceptedTerms} onValueChange={setAcceptedTerms} />
        <Text style={{ marginLeft:8 }}>Aceito os termos</Text>
      </View>
      <Button onPress={handleRegister} disabled={loading}>
        {loading ? 'Cadastrando...' : 'Cadastrar'}
      </Button>
    </View>
  );
}

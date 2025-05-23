// apps/client-react-native/components/RegisterForm.tsx
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Alert,
  Switch,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Button } from './Button';
import { registerUser } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

interface RegisterFormProps {
  onBack?: () => void;
  onLogin?: () => void;
}

export default function RegisterForm({ onBack, onLogin }: RegisterFormProps) {
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
      router.replace('/home');
    } catch (err: any) {
      Alert.alert(
        'Falha ao cadastrar',
        err?.response?.data?.msg || err.message
      );
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

      {/* TÍTULO */}
      <Text style={styles.title}>Cadastrar-se no Clubily</Text>

      {/* INPUTS */}
      <TextInput
        placeholder="Nome"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <TextInput
        placeholder="Email"
        keyboardType="email-address"
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

      <View style={styles.termsRow}>
        <Switch value={acceptedTerms} onValueChange={setAcceptedTerms} />
        <Text style={styles.termsText}>Aceito os termos</Text>
      </View>

      {/* BOTÃO CADASTRAR */}
      <Button
        onPress={handleRegister}
        disabled={loading}
        style={styles.registerButton}
      >
        {loading ? 'Cadastrando...' : 'Cadastrar'}
      </Button>

      {/* FOOTER REGISTRO */}
      <Text style={styles.footerText}>Já tem uma conta?</Text>
      {onLogin && (
        <TouchableOpacity onPress={onLogin}>
          <Text style={styles.linkText}>Entrar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // altura automática
  },
  backButton: {
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  termsText: {
    marginLeft: 8,
  },
  registerButton: {
    marginTop: 8,
  },
  footerText: {
    marginTop: 16,
    textAlign: 'center',
    color: '#666',
  },
  linkText: {
    marginTop: 4,
    textAlign: 'center',
    color: '#007AFF',
    fontWeight: '500',
  },
});

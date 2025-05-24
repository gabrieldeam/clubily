// apps/client-react-native/components/LoginForm.tsx
import React, { useState } from 'react';
import {
  View,
  Alert,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Button } from './Button';
import FloatingLabelInput from './FloatingLabelInput';
import { loginUser } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

interface LoginFormProps {
  onRegister?: () => void;
  onSuccess?: () => void;
}

export default function LoginForm({ onRegister, onSuccess }: LoginFormProps) {
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
      if (onSuccess) {
        onSuccess();              
      }
    } catch (err: any) {
      Alert.alert('Falha ao entrar', err?.response?.data?.msg || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={styles.container}
    >
      <Text style={styles.title}>Entrar para o Clubily</Text>

      <FloatingLabelInput
        label="Email ou Telefone"
        value={identifier}
        onChangeText={setIdentifier}
      />
      <FloatingLabelInput
        label="Senha"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button onPress={handleLogin} disabled={loading} style={styles.loginButton}>
        {loading ? 'Entrando...' : 'Entrar'}
      </Button>

      <View style={styles.inlineFooter}>
        <Text style={styles.footerText}>Ainda não tem uma conta?</Text>
        {onRegister && (
          <TouchableOpacity onPress={onRegister}>
            <Text style={styles.linkText}> Cadastrar-se</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.policiesRow}>
        <TouchableOpacity onPress={() => router.push('./policies/terms')}>
          <Text style={styles.policyLink}>Termos de uso</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('./policies/privacy')}>
          <Text style={styles.policyLink}>Política de privacidade</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
    marginTop: 80,
  },
  loginButton: {
    marginTop: 8,
  },
  inlineFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  footerText: {
    color: '#666',
  },
  linkText: {
    color: '#FFA600',
    fontWeight: '500',
  },
  policiesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 80,
    marginBottom: 20,
  },
  policyLink: {
    color: '#FFA600',
    marginHorizontal: 16,
    fontWeight: '500',
  },
});
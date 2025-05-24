import React, { useState } from 'react';
import {
  View,
  Alert,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Button } from './Button';
import FloatingLabelInput from './FloatingLabelInput';
import { registerUser } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

interface RegisterFormProps {
  onLogin?: () => void;
}

// regex: ≥8 chars, 1 upper, 1 lower, 1 digit, 1 special
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export default function RegisterForm({ onLogin }: RegisterFormProps) {
  const { refreshUser } = useAuth();
  const router = useRouter();

  // form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!acceptedTerms) {
      Alert.alert('Você deve aceitar os termos');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('As senhas não conferem');
      return;
    }

    if (!passwordRegex.test(password)) {
      Alert.alert(
        'Senha inválida',
        'Senha deve ter ≥8 caracteres, incluindo 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial.'
      );
      return;
    }

    setLoading(true);
    try {
      await registerUser({
        name,
        email,
        phone,
        password,
        accepted_terms: true,
      });
      await refreshUser();
      router.replace('/home');
    } catch (err: any) {
      Alert.alert('Falha ao cadastrar', err?.response?.data?.msg || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* TÍTULO */}
      <Text style={styles.title}>Cadastrar-se no Clubily</Text>

      {/* INPUTS */}
      <FloatingLabelInput label="Nome" value={name} onChangeText={setName} />

      {/* EMAIL + TELEFONE NA MESMA LINHA */}
      <View style={styles.contactRow}>
        <View style={styles.emailCol}>
          <FloatingLabelInput
            label="Email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>
        <View style={styles.phoneCol}>
          <FloatingLabelInput
            label="Telefone"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>
      </View>

      {/* Senha + Confirmar lado a lado */}
      <View style={styles.passwordRow}>
        <View style={styles.passwordCol}>
          <FloatingLabelInput
            label="Senha"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>
        <View style={styles.passwordColRight}>
          <FloatingLabelInput
            label="Confirmar"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>
      </View>

      {/* TERMOS */}
      <View style={styles.termsRow}>
        <Switch value={acceptedTerms} onValueChange={setAcceptedTerms} />
        <Text style={styles.termsText}>Aceito os termos</Text>
      </View>

      {/* BOTÃO */}
      <Button onPress={handleRegister} disabled={loading} style={styles.registerButton}>
        {loading ? 'Cadastrando...' : 'Cadastrar'}
      </Button>

      {/* FOOTER */}
      <View style={styles.inlineFooter}>
        <Text style={styles.footerText}>Já tem uma conta?</Text>
        {onLogin && (
          <TouchableOpacity onPress={onLogin}>
            <Text style={styles.linkText}> Entrar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* POLICIES */}
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
    marginTop: 50,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 5,
    marginBottom: 5,
  },
  emailCol: {
    flex: 1.2,
  },
  phoneCol: {
    flex: 1,
    marginLeft: 12,
  },
  passwordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 5,
  },
  passwordCol: {
    flex: 1,
  },
  passwordColRight: {
    flex: 1,
    marginLeft: 12,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 12,
  },
  termsText: {
    marginLeft: 8,
  },
  registerButton: {
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
    marginTop: 50,
    marginBottom: 20,
  },
  policyLink: {
    color: '#FFA600',
    marginHorizontal: 16,
    fontWeight: '500',
  },
});
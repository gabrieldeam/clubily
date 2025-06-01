// apps/client-react-native/components/LoginForm.tsx
import React, { useState } from 'react';
import {
  View,
  Alert,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutChangeEvent,
} from 'react-native';
import { Button } from './Button';
import FloatingLabelInput from './FloatingLabelInput';
import {
  loginUser,
  forgotPasswordUser,
} from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

interface LoginFormProps {
  onRegister?: () => void;
  onSuccess?: () => void;
  onLayoutContainer?: (e: LayoutChangeEvent) => void;
}

export default function LoginForm({ onRegister, onSuccess, onLayoutContainer }: LoginFormProps) {
  const { refreshUser } = useAuth();
  const router = useRouter();

  // estados para login
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);

  // estados para "esqueci a senha"
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [emailForReset, setEmailForReset] = useState('');
  const [loadingForgot, setLoadingForgot] = useState(false);
  const [forgotDone, setForgotDone] = useState(false);

  const handleLogin = async () => {
    setLoadingLogin(true);
    try {
      await loginUser({ identifier, password });
      await refreshUser();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      Alert.alert('Falha ao entrar', err?.response?.data?.msg || err.message);
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!emailForReset) {
      Alert.alert('Informe seu e-mail');
      return;
    }
    setLoadingForgot(true);
    try {
      const resp = await forgotPasswordUser(emailForReset);
      Alert.alert('Sucesso', resp.data.msg);
      setForgotDone(true);
    } catch (err: any) {
      Alert.alert(
        'Erro',
        err?.response?.data?.msg ||
          'Não foi possível enviar o e-mail. Tente mais tarde.'
      );
    } finally {
      setLoadingForgot(false);
    }
  };

  const renderLogin = () => (
    <View style={styles.container} onLayout={onLayoutContainer}>
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

      <TouchableOpacity onPress={() => {
        setMode('forgot');
        setForgotDone(false);
        setEmailForReset('');
      }}>
        <Text style={styles.forgotText}>Esqueceu a senha?</Text>
      </TouchableOpacity>

      <Button
        onPress={handleLogin}
        disabled={loadingLogin}
        style={styles.loginButton}
      >
        {loadingLogin ? 'Entrando...' : 'Entrar'}
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

  const renderForgot = () => {
    if (forgotDone) {
      return (
        <View style={styles.container} onLayout={onLayoutContainer}>
          <Text style={styles.title}>Redefinir senha</Text>
          <Text style={styles.infoText}>
            E-mail enviado! Verifique sua caixa de entrada para instruções.
          </Text>
          <TouchableOpacity onPress={() => setMode('login')}>
            <Text style={[styles.linkText, { marginTop: 20 }]}>
              Voltar ao login
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.container} onLayout={onLayoutContainer}>
        <Text style={styles.title}>Esqueci minha senha</Text>

      <FloatingLabelInput
       label="Digite seu e-mail"
       value={emailForReset}
       onChangeText={setEmailForReset}
       keyboardType="email-address"
       autoCapitalize="none"
     />

        <TouchableOpacity onPress={() => setMode('login')}>
          <Text style={[styles.linkText, { marginTop: 10 }]}>
            Voltar ao login
          </Text>
        </TouchableOpacity>

        <Button
          onPress={handleForgotPassword}
          disabled={loadingForgot}
          style={[styles.loginButton, { marginTop: 16 }]}
        >
          {loadingForgot ? 'Enviando...' : 'Enviar link de redefinição'}
        </Button>

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
  };

  return mode === 'login' ? renderLogin() : renderForgot();
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
  forgotText: {
    color: '#FFA600',
    textAlign: 'right',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#CCC',
  },
  infoText: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
  },
});

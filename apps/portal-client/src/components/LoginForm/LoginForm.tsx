// src/components/LoginForm/LoginForm.tsx
'use client';

import { FormEvent, useState } from 'react';
import styles from './LoginForm.module.css';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import Notification from '@/components/Notification/Notification';
import Button from '@/components/Button/Button';
import axios from 'axios';
import {
  loginUser,
  forgotPasswordUser,
  resetPasswordUser,
} from '@/services/userService';

type NotificationType = 'success' | 'error' | 'info';
interface NotificationData {
  type: NotificationType;
  message: string;
}

interface LoginFormProps {
  onSuccess: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [mode, setMode] = useState<'login' | 'forgot' | 'reset'>('login');
  const [identifier, setIdentifier] = useState('');   // para login
  const [password, setPassword] = useState('');       // para login
  const [email, setEmail] = useState('');             // para forgot
  const [code, setCode] = useState('');               // para reset
  const [newPassword, setNewPassword] = useState(''); // para reset
  const [notification, setNotification] = useState<NotificationData | null>(null);

  function clearAll() {
    setIdentifier('');
    setPassword('');
    setEmail('');
    setCode('');
    setNewPassword('');
    setNotification(null);
  }

  // Helper to extract error detail from Axios responses
  function extractErrorDetail(error: unknown): string | undefined {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data;
      if (data && typeof (data as Record<string, unknown>).detail === 'string') {
        return (data as { detail: string }).detail;
      }
    }
    return undefined;
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setNotification(null);
    try {
      await loginUser({ identifier, password });
      setNotification({ type: 'success', message: 'Login realizado!' });
      onSuccess();
    } catch (err: unknown) {
      let detail = 'Credenciais incorretas, falha no login.';
      const serverDetail = extractErrorDetail(err);
      if (serverDetail) {
        detail = serverDetail;
      }
      setNotification({ type: 'error', message: detail });
    }
  }

async function handleForgot(e: FormEvent) {
  e.preventDefault();
  setNotification(null);

  try {
    const { data } = await forgotPasswordUser(email);
    setNotification({ type: 'info', message: data.msg });
    setMode('reset');
  } catch (err: unknown) {
    const serverDetail = extractErrorDetail(err) ?? 'Erro ao enviar código.';
    setNotification({ type: 'error', message: serverDetail });
  }
}

  async function handleReset(e: FormEvent) {
    e.preventDefault();
    setNotification(null);
    try {
      await resetPasswordUser(code, newPassword);
      setNotification({ type: 'success', message: 'Senha redefinida com sucesso!' });
      setMode('login');
      clearAll();
    } catch (err: unknown) {
      let detail = 'Erro na redefinição.';
      const serverDetail = extractErrorDetail(err);
      if (serverDetail) {
        detail = serverDetail;
      }
      setNotification({ type: 'error', message: detail });
    }
  }

  return (
    <form
      onSubmit={
        mode === 'login'
          ? handleLogin
          : mode === 'forgot'
          ? handleForgot
          : handleReset
      }
      className={styles.form}
    >
      <h2 className={styles.title}>
        {mode === 'login'
          ? 'Login'
          : mode === 'forgot'
          ? 'Redefinir senha'
          : 'Nova senha'}
      </h2>

      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {mode === 'login' && (
        <>
          <FloatingLabelInput
            id="login-identifier"
            name="identifier"
            label="E-mail ou Telefone"
            type="text"
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            required
          />
          <FloatingLabelInput
            id="login-password"
            name="password"
            label="Senha"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => {
              clearAll();
              setMode('forgot');
            }}
          >
            Esqueci minha senha
          </button>
        </>
      )}

      {mode === 'forgot' && (
        <FloatingLabelInput
          id="forgot-email"
          name="email"
            label="E-mail cadastrado"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
        />
      )}

      {mode === 'reset' && (
        <>
          <FloatingLabelInput
            id="reset-code"
            name="code"
            label="Código de verificação"
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            required
          />
          <FloatingLabelInput
            id="reset-password"
            name="newPassword"
            label="Nova senha"
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
          />
        </>
      )}

      <div className={styles.actions}>
        <Button type="submit">
          {mode === 'login'
            ? 'Entrar'
            : mode === 'forgot'
            ? 'Enviar código'
            : 'Redefinir senha'}
        </Button>
      </div>

      {mode !== 'login' && (
        <div className={styles.link}>
          <a
            onClick={() => {
              clearAll();
              setMode('login');
            }}
          >
            Voltar ao login
          </a>
        </div>
      )}
    </form>
  );
}

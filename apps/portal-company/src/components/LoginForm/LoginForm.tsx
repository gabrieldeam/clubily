// src/components/LoginForm/LoginForm.tsx
'use client';

import { FormEvent, useState } from 'react';
import { isAxiosError } from 'axios';
import styles from './LoginForm.module.css';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import Notification from '@/components/Notification/Notification';
import Button from '@/components/Button/Button';
import {
  loginCompany,
  forgotPasswordCompany,
  resetPasswordCompany,
} from '@/services/companyService';

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
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [notification, setNotification] =
    useState<NotificationData | null>(null);

  /* ------------------------------ helpers ------------------------------ */
  const clearAll = () => {
    setIdentifier('');
    setPassword('');
    setEmail('');
    setCode('');
    setNewPassword('');
    setNotification(null);
  };

  /* ------------------------------- login ------------------------------- */
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setNotification(null);
    try {
      await loginCompany({ identifier, password });
      setNotification({ type: 'success', message: 'Login realizado!' });
      onSuccess();
    } catch (err) {
      const detail = isAxiosError(err)
        ? err.response?.data?.detail
        : undefined;
      setNotification({
        type: 'error',
        message: detail || 'Falha no login.',
      });
    }
  };

  /* -------------------------- forgot password -------------------------- */
  const handleForgot = async (e: FormEvent) => {
    e.preventDefault();
    setNotification(null);
    try {
      await forgotPasswordCompany(email);
      setNotification({
        type: 'info',
        message: 'Código enviado para seu e-mail.',
      });
      setMode('reset');
    } catch (err) {
      const detail = isAxiosError(err)
        ? err.response?.data?.detail
        : undefined;
      setNotification({
        type: 'error',
        message: detail || 'Erro ao enviar código.',
      });
    }
  };

  /* --------------------------- reset password -------------------------- */
  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    setNotification(null);
    try {
      await resetPasswordCompany(code, newPassword);
      setNotification({
        type: 'success',
        message: 'Senha redefinida com sucesso!',
      });
      setMode('login');
      clearAll();
    } catch (err) {
      const detail = isAxiosError(err)
        ? err.response?.data?.detail
        : undefined;
      setNotification({
        type: 'error',
        message: detail || 'Erro na redefinição.',
      });
    }
  };

  /* -------------------------------- JSX -------------------------------- */
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

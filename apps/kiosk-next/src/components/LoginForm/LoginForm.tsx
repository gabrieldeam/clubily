'use client';

import { FormEvent, useState } from 'react';
import styles from './LoginForm.module.css';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import Notification from '@/components/Notification/Notification';
import Button from '@/components/Button/Button';
import { loginCompany } from '@/services/companyService';

type NotificationType = 'success' | 'error' | 'info';
interface NotificationData {
  type: NotificationType;
  message: string;
}

interface LoginFormProps {
  onSuccess: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [notification, setNotification] = useState<NotificationData | null>(null);

  const clearAll = () => {
    setIdentifier('');
    setPassword('');
    setNotification(null);
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setNotification(null);
    try {
      await loginCompany({ identifier, password });
      setNotification({ type: 'success', message: 'Login realizado!' });
      onSuccess();
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Falha no login.';
      setNotification({ type: 'error', message: detail });
    }
  };

  return (
    <form onSubmit={handleLogin} className={styles.form}>
      <h2 className={styles.title}>Login</h2>

      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

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

      <div className={styles.actions}>
        <Button type="submit">Entrar</Button>
      </div>
    </form>
  );
}

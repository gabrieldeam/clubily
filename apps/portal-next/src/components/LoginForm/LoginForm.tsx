'use client';

import { FormEvent, useState } from 'react';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import Notification from '@/components/Notification/Notification';
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setNotification(null);

    try {
      await loginCompany({ identifier, password });
      setNotification({
        type: 'success',
        message: 'Login realizado com sucesso!',
      });
      onSuccess();
    } catch (error: any) {
      console.error(error);
      const detail =
        (error.response?.data as any)?.detail ||
        'Falha no login. Verifique suas credenciais.';
      setNotification({ type: 'error', message: detail });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>

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

      <button type="submit">Entrar</button>
    </form>
  );
}

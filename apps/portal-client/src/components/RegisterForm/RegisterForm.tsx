// src/components/RegisterForm/RegisterForm.tsx
'use client';

import { FormEvent, useState } from 'react';
import styles from './RegisterForm.module.css';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import Notification from '@/components/Notification/Notification';
import Button from '@/components/Button/Button';
import { registerUser } from '@/services/userService';
import axios from 'axios';
import type { UserCreate } from '@/types/user';

type NotificationType = 'success' | 'error' | 'info';
interface NotificationData {
  type: NotificationType;
  message: string;
}

type LocalForm = UserCreate & { confirm_password: string };

interface RegisterFormProps {
  onSuccess: () => void;
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [form, setForm] = useState<LocalForm>({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    password: '',
    confirm_password: '',
    accepted_terms: false,
  });
  const [notification, setNotification] = useState<NotificationData | null>(null);

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

  const formatCPF = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    let formatted = digits;
    if (digits.length > 3) formatted = `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length > 6) formatted = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    if (digits.length > 9) formatted = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
    return formatted;
  };

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, type, value: rawValue, checked } = e.target;
    let value: string | boolean = type === 'checkbox' ? checked : rawValue;

    if (name === 'cpf') value = formatCPF(rawValue);

    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (name === 'password') {
      if (rawValue && !passwordRegex.test(rawValue)) {
        setNotification({
          type: 'error',
          message:
            'Senha deve ter ≥8 caracteres, incluindo 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial.',
        });
      } else {
        setNotification(null);
      }
    }

    if (name === 'confirm_password') {
      if (rawValue && rawValue !== form.password) {
        setNotification({ type: 'error', message: 'As senhas não coincidem.' });
      } else {
        setNotification(null);
      }
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setNotification(null);

    const missing: string[] = [];
    if (!form.name) missing.push('Nome');
    if (!form.email) missing.push('E-mail');
    if (!form.phone) missing.push('Telefone');
    if (!form.cpf) missing.push('CPF');
    if (!form.password) missing.push('Senha');
    if (!form.confirm_password) missing.push('Confirmação de senha');
    if (!form.accepted_terms) missing.push('Termos de uso');

    if (missing.length > 0) {
      setNotification({
        type: 'error',
        message: `Campo${missing.length > 1 ? 's' : ''} ${missing.join(', ')} ${
          missing.length > 1 ? 'são' : 'é'
        } obrigatório${missing.length > 1 ? 's' : ''}.`,
      });
      return;
    }

    if (!passwordRegex.test(form.password)) {
      setNotification({
        type: 'error',
        message:
          'Senha deve ter ≥8 caracteres, incluindo 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial.',
      });
      return;
    }

    if (form.password !== form.confirm_password) {
      setNotification({ type: 'error', message: 'As senhas não coincidem.' });
      return;
    }

    // Monta payload sem o campo confirm_password
    const payload: Omit<LocalForm, 'confirm_password'> = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      cpf: form.cpf,
      password: form.password,
      accepted_terms: form.accepted_terms,
    };

    try {
      await registerUser(payload);
      setNotification({
        type: 'success',
        message: 'Cadastro realizado! Verifique seu e-mail.',
      });
      setForm(prev => ({ ...prev, password: '', confirm_password: '' }));
      onSuccess();
    } catch (error: unknown) {
      console.error(error);
      let detailMsg = 'Erro no cadastro. Tente novamente.';
      if (axios.isAxiosError(error) && error.response?.data) {
        const data = error.response.data as { detail: string | Array<{ msg: string }> };
        if (typeof data.detail === 'string') {
          detailMsg = data.detail;
        } else {
          detailMsg = data.detail.map(d => d.msg).join(', ');
        }
      }
      setNotification({ type: 'error', message: detailMsg });
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.title}>Cadastro</h2>
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <FloatingLabelInput
        id="register-name"
        name="name"
        label="Nome"
        type="text"
        value={form.name}
        onChange={handleChange}
      />
      <FloatingLabelInput
        id="register-email"
        name="email"
        label="E-mail"
        type="email"
        value={form.email}
        onChange={handleChange}
      />
      <FloatingLabelInput
        id="register-phone"
        name="phone"
        label="Telefone"
        type="text"
        value={form.phone}
        onChange={handleChange}
      />
      <FloatingLabelInput
        id="register-cpf"
        name="cpf"
        label="CPF"
        type="text"
        value={form.cpf}
        onChange={handleChange}
        maxLength={14}
      />

      <div className={styles.display}>
        <FloatingLabelInput
          id="register-password"
          name="password"
          label="Senha"
          type="password"
          value={form.password}
          onChange={handleChange}
        />
        <FloatingLabelInput
          id="register-confirm-password"
          name="confirm_password"
          label="Confirme a senha"
          type="password"
          value={form.confirm_password}
          onChange={handleChange}
        />
      </div>

      <div className={styles.termsContainer}>
        <input
          type="checkbox"
          id="accepted_terms"
          name="accepted_terms"
          checked={form.accepted_terms}
          onChange={handleChange}
        />
        <label htmlFor="accepted_terms">Aceito os termos de uso</label>
      </div>

      <Button type="submit">Cadastrar</Button>
    </form>
  );
}

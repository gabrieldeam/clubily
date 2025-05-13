// src/components/RegisterForm/RegisterForm.tsx
'use client';

import { FormEvent, useState } from 'react';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import Notification from '@/components/Notification/Notification';
import { registerCompany } from '@/services/companyService';
import type { CompanyCreate } from '@/types/company';

type NotificationType = 'success' | 'error' | 'info';
interface NotificationData {
  type: NotificationType;
  message: string;
}

interface RegisterFormProps {
  onSuccess: () => void;
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [form, setForm] = useState<CompanyCreate>({
    name: '',
    email: '',
    phone: '',
    cnpj: '',
    street: '',
    city: '',
    state: '',
    postal_code: '',
    description: '',
    password: '',
    accepted_terms: false,
  });
  const [notification, setNotification] = useState<NotificationData | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, type, value, checked } = e.target as HTMLInputElement;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setNotification(null);

    try {
      await registerCompany(form);
      setNotification({
        type: 'success',
        message: 'Cadastro realizado! Verifique seu e-mail para confirmação.',
      });
      setForm(prev => ({ ...prev, password: '' }));
      onSuccess();
    } catch (error: any) {
      console.error(error);
      const detail =
        (error.response?.data as any)?.detail ||
        'Erro no cadastro. Verifique os dados e tente novamente.';
      setNotification({ type: 'error', message: detail });
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <h2>Cadastro</h2>

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
        required
      />

      <FloatingLabelInput
        id="register-email"
        name="email"
        label="E-mail"
        type="email"
        value={form.email}
        onChange={handleChange}
        required
      />

      <FloatingLabelInput
        id="register-phone"
        name="phone"
        label="Telefone"
        type="text"
        value={form.phone}
        onChange={handleChange}
        required
      />

      <FloatingLabelInput
        id="register-cnpj"
        name="cnpj"
        label="CNPJ (14 dígitos)"
        type="text"
        value={form.cnpj}
        onChange={handleChange}
        required
      />

      <FloatingLabelInput
        id="register-street"
        name="street"
        label="Rua"
        type="text"
        value={form.street}
        onChange={handleChange}
        required
      />

      <FloatingLabelInput
        id="register-city"
        name="city"
        label="Cidade"
        type="text"
        value={form.city}
        onChange={handleChange}
        required
      />

      <FloatingLabelInput
        id="register-state"
        name="state"
        label="Estado"
        type="text"
        value={form.state}
        onChange={handleChange}
        required
      />

      <FloatingLabelInput
        id="register-postal_code"
        name="postal_code"
        label="CEP"
        type="text"
        value={form.postal_code}
        onChange={handleChange}
        required
      />

      <div style={{ margin: '1rem 0', width: '100%' }}>
        <label htmlFor="register-description">Descrição</label>
        <textarea
          id="register-description"
          name="description"
          placeholder="Descrição"
          value={form.description}
          onChange={handleChange}
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            border: '1px solid #ccc',
            fontFamily: 'inherit',
            resize: 'vertical',
          }}
        />
      </div>

      <FloatingLabelInput
        id="register-password"
        name="password"
        label="Senha"
        type="password"
        value={form.password}
        onChange={handleChange}
        required
      />

      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
        <input
          id="register-accepted_terms"
          name="accepted_terms"
          type="checkbox"
          checked={form.accepted_terms}
          onChange={handleChange}
          required
        />
        Aceito os termos de uso
      </label>

      <button type="submit" style={{ marginTop: '1.5rem' }}>
        Registrar
      </button>
    </form>
  );
}

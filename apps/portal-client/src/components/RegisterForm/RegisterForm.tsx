// src/components/RegisterForm/RegisterForm.tsx
'use client';

import { FormEvent, useEffect, useState } from 'react';
import styles from './RegisterForm.module.css';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import Notification from '@/components/Notification/Notification';
import Button from '@/components/Button/Button';
import { registerCompany } from '@/services/companyService';
import type { CompanyCreate } from '@/types/company';

type NotificationType = 'success' | 'error' | 'info';
interface NotificationData {
  type: NotificationType;
  message: string;
}

type LocalForm = CompanyCreate & { confirm_password: string };

interface RegisterFormProps {
  onSuccess: () => void;
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [form, setForm] = useState<LocalForm>({
    name: '',
    email: '',
    phone: '',
    cnpj: '',
    password: '',
    confirm_password: '',
    postal_code: '',
    street: '',
    city: '',
    state: '',
    description: '',
    accepted_terms: false,
  });
  const [notification, setNotification] = useState<NotificationData | null>(null);
  const [showAddress, setShowAddress] = useState(false);

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

  useEffect(() => {
    const cep = form.postal_code.replace(/\D/g, '');
    if (showAddress && cep.length === 8) {
      fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(res => res.json())
        .then(data => {
          if (data.erro) {
            setNotification({ type: 'error', message: 'CEP não encontrado.' });
          } else {
            setForm(prev => ({
              ...prev,
              street: data.logradouro || '',
              city: data.localidade || '',
              state: data.uf || '',
            }));
          }
        })
        .catch(() => setNotification({ type: 'error', message: 'Erro ao buscar CEP.' }));
    }
  }, [form.postal_code, showAddress]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, type, value, checked } = e.target as HTMLInputElement;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));

    if (name === 'password') {
      if (value && !passwordRegex.test(value)) {
        setNotification({
          type: 'error',
          message: 'Senha deve ter ≥8 caracteres, incluindo 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial.',
        });
      } else {
        setNotification(null);
      }
    }

    if (name === 'confirm_password') {
      if (value && value !== form.password) {
        setNotification({ type: 'error', message: 'As senhas não coincidem.' });
      } else {
        setNotification(null);
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setNotification(null);

    const missing: string[] = [];
    if (!form.name) missing.push('Nome');
    if (!form.email) missing.push('E-mail');
    if (!form.phone) missing.push('Telefone');
    if (!form.cnpj) missing.push('CNPJ');
    if (!form.password) missing.push('Senha');
    if (!form.confirm_password) missing.push('Confirmação de senha');
    if (!form.postal_code) missing.push('CEP');
    if (!form.street) missing.push('Rua');
    if (!form.city) missing.push('Cidade');
    if (!form.state) missing.push('Estado');
    if (!form.accepted_terms) missing.push('Termos de uso');

    if (missing.length > 0) {
      setNotification({
        type: 'error',
        message: `Campo${missing.length > 1 ? 's' : ''} ${missing.join(', ')} ${missing.length > 1 ? 'são' : 'é'} obrigatório${missing.length > 1 ? 's' : ''}.`,
      });
      return;
    }

    if (!passwordRegex.test(form.password)) {
      setNotification({
        type: 'error',
        message: 'Senha deve ter ≥8 caracteres, incluindo 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial.',
      });
      return;
    }

    if (form.password !== form.confirm_password) {
      setNotification({ type: 'error', message: 'As senhas não coincidem.' });
      return;
    }

    const { confirm_password, ...payload } = form;

    try {
      await registerCompany(payload);
      setNotification({ type: 'success', message: 'Cadastro realizado! Verifique seu e-mail.' });
      setForm(prev => ({ ...prev, password: '', confirm_password: '' }));
      onSuccess();
    } catch (error: any) {
      console.error(error);
      const data = error.response?.data;
      let detailMsg = 'Erro no cadastro. Tente novamente.';
      if (data) {
        if (typeof data.detail === 'string') {
          detailMsg = data.detail;
        } else if (Array.isArray(data.detail)) {
          detailMsg = data.detail.map((d: any) => d.msg).join(', ');
        }
      }
      setNotification({ type: 'error', message: detailMsg });
    }
  };

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

      {!showAddress && (
        <>
          <FloatingLabelInput id="register-name" name="name" label="Nome" type="text" value={form.name} onChange={handleChange} />
          <FloatingLabelInput id="register-email" name="email" label="E-mail" type="email" value={form.email} onChange={handleChange} />
          <FloatingLabelInput id="register-phone" name="phone" label="Telefone" type="text" value={form.phone} onChange={handleChange} />
          <FloatingLabelInput id="register-cnpj" name="cnpj" label="CNPJ" type="text" value={form.cnpj} onChange={handleChange} />

          <button type="button" className={styles.addressButton} onClick={() => setShowAddress(true)}>
            Adicionar Endereço
          </button>

          <FloatingLabelInput id="register-password" name="password" label="Senha" type="password" value={form.password} onChange={handleChange} />
          <FloatingLabelInput id="register-confirm-password" name="confirm_password" label="Confirme a senha" type="password" value={form.confirm_password} onChange={handleChange} />

          <div className={styles.termsContainer}>
            <input type="checkbox" id="accepted_terms" name="accepted_terms" checked={form.accepted_terms} onChange={handleChange} />
            <label htmlFor="accepted_terms">Aceito os termos de uso</label>
          </div>

          <Button type="submit">Cadastrar</Button>
        </>
      )}

      {showAddress && (
        <>
          <FloatingLabelInput id="register-postal_code" name="postal_code" label="CEP" type="text" value={form.postal_code} onChange={handleChange} />
          <FloatingLabelInput id="register-street" name="street" label="Rua" type="text" value={form.street} onChange={handleChange} />
          <FloatingLabelInput id="register-city" name="city" label="Cidade" type="text" value={form.city} onChange={handleChange} />
          <FloatingLabelInput id="register-state" name="state" label="Estado" type="text" value={form.state} onChange={handleChange} />

          <Button bgColor="#FFA600" onClick={() => setShowAddress(false)}>
            Continuar
          </Button>
        </>
      )}
    </form>
  );
}
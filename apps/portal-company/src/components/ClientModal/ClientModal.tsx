// src/components/ClientModal/ClientModal.tsx
'use client';

import { FormEvent, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { preRegister, checkPreRegistered } from '@/services/userService';
import type { LeadCreate } from '@/types/user';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import Notification from '@/components/Notification/Notification';
import Button from '@/components/Button/Button';
import styles from './ClientModal.module.css';

interface ClientModalProps {
  onClose: () => void;
}

export default function ClientModal({ onClose }: ClientModalProps) {
  const { user } = useAuth();
  const companyId = user?.id ?? '';

  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!companyId) {
      setNotification({ type: 'error', message: 'Empresa não autenticada.' });
      return;
    }

    // Remove tudo que não for dígito do telefone
    const rawPhone = phone.replace(/\D/g, '');
    // Converte e-mail para lowercase e trim
    const rawEmail = email.trim().toLowerCase();

    // Validação: pelo menos um dos dois (telefone ou e-mail) deve estar preenchido
    if (!rawPhone && !rawEmail) {
      setNotification({
        type: 'error',
        message: 'Informe pelo menos Telefone ou E-mail do cliente.',
      });
      return;
    }

    // Se e-mail estiver presente, checa formato básico
    if (rawEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      setNotification({
        type: 'error',
        message: 'E-mail inválido.',
      });
      return;
    }

    setLoading(true);
    setNotification(null);

    // Monta o payload como LeadCreate (email e phone são opcionais)
    const payload = {
      company_id: companyId,
      phone: rawPhone || undefined,
      email: rawEmail || undefined,
    } as LeadCreate;

    try {
      // Checa se já existe pré-registro para esse telefone ou e-mail
      const check = await checkPreRegistered(payload);
      if (check.data.pre_registered) {
        setNotification({
          type: 'error',
          message: 'Este cliente já está pré-registrado.',
        });
      } else {
        // Faz o preRegister passando o payload
        await preRegister(payload);
        setNotification({
          type: 'success',
          message: 'Cliente pré-registrado com sucesso!',
        });
        setPhone('');
        setEmail('');
      }
    } catch (err: any) {
      console.error(err);
      setNotification({
        type: 'error',
        message:
          err.response?.data?.detail ||
          'Erro ao pré-registrar o cliente. Tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2 className={styles.title}>Pré-cadastrar Cliente</h2>

      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Campo Telefone */}
      <FloatingLabelInput
        id="client-phone"
        name="phone"
        label="Telefone do cliente"
        type="text"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      {/* Separador “— e/ou —” */}
      <div className={styles.separator}>e/ou</div>

      {/* Campo E-mail */}
      <FloatingLabelInput
        id="client-email"
        name="email"
        label="E-mail do cliente"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <div className={styles.actions}>
        <Button type="submit" disabled={loading}>
          {loading ? 'Processando...' : 'Pré-cadastrar'}
        </Button>
        <Button type="button" bgColor="#AAA" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

// src/components/ClientModal/ClientModal.tsx
'use client';

import { FormEvent, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { preRegister, checkPreRegistered } from '@/services/userService';
import type { LeadCreate, UserRead } from '@/types/user';
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
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);

  // Se já encontrarmos um usuário existente, armazenamos aqui
  const [existingUser, setExistingUser] = useState<UserRead | null>(null);

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

    // Remove tudo que não for dígito de phone e cpf
    const rawPhone = phone.replace(/\D/g, '');
    const rawCpf = cpf.replace(/\D/g, '');

    // Validação: pelo menos um dos dois deve estar preenchido
    if (!rawPhone && !rawCpf) {
      setNotification({
        type: 'error',
        message: 'Informe pelo menos Telefone ou CPF do cliente.',
      });
      return;
    }

    setLoading(true);
    setNotification(null);

    // Monta o payload como LeadCreate (campo email foi removido)
    const payload = {
      company_id: companyId,
      phone: rawPhone || undefined,
      cpf: rawCpf || undefined,
    } as LeadCreate;

    try {
      // 1) Tenta buscar usuário existente
      const response = await checkPreRegistered(payload);
      // Se chegamos aqui, o servidor retornou 200 com um UserRead
      const userFound: UserRead = response.data;
      setExistingUser(userFound);
      setNotification({
        type: 'info',
        message: 'Cliente já pré-registrado. Veja os dados abaixo.',
      });
    } catch (err: any) {
      // Se for 404, significa que NÃO encontrou; aí chamamos preRegister
      if (err.response?.status === 404) {
        try {
          await preRegister(payload);
          setNotification({
            type: 'success',
            message: 'Cliente pré-registrado com sucesso!',
          });
          setPhone('');
          setCpf('');
        } catch (err2: any) {
          console.error(err2);
          setNotification({
            type: 'error',
            message:
              err2.response?.data?.detail ||
              'Erro ao pré-registrar o cliente. Tente novamente.',
          });
        }
      } else if (err.response?.status === 400) {
        setNotification({
          type: 'error',
          message: err.response.data.detail ?? 'Requisição inválida.',
        });
      } else {
        console.error(err);
        setNotification({
          type: 'error',
          message: 'Erro inesperado. Tente novamente mais tarde.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Renderiza informações do usuário já cadastrado (com mascaramento, se for pre_registered)
  if (existingUser) {
    const isPre = existingUser.pre_registered === true;

    // Mascara name e email sempre que isPre === true
    const displayName = isPre ? '*****' : existingUser.name;
    const displayEmail = isPre ? '*****' : existingUser.email;

    // Para o CPF, se isPre e últimos 6 dígitos do CPF === telefone, mascara; senão, exibe normal
    let displayCpf = existingUser.cpf;
    if (isPre && existingUser.phone) {
      const last6Cpf = existingUser.cpf.slice(-6);
      const last6Phone = existingUser.phone.slice(-6);
      if (last6Cpf === last6Phone) {
        displayCpf = '*****';
      }
    }

    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Cliente Pré-registrado</h2>

        {notification && (
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}

        <div className={styles.userInfo}>
          <p>
            <strong>Nome</strong> {displayName}
          </p>
          <p>
            <strong>E-mail</strong> {displayEmail}
          </p>
          <p>
            <strong>CPF</strong> {displayCpf}
          </p>
          {existingUser.phone && (
            <p>
              <strong>Telefone</strong> {existingUser.phone}
            </p>
          )}
        </div>

        <div className={styles.actions}>
          <Button type="button" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    );
  }

  // Caso contrário, renderiza o formulário normalmente
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

      {/* Campo CPF */}
      <FloatingLabelInput
        id="client-cpf"
        name="cpf"
        label="CPF do cliente"
        type="text"
        value={cpf}
        onChange={(e) => setCpf(e.target.value)}
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

'use client';

import { FormEvent, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { preRegister, checkPreRegistered } from '@/services/userService';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import Notification from '@/components/Notification/Notification';
import Button from '@/components/Button/Button';
import styles from './ClientModal.module.css';

interface ClientModalProps {
  onClose: () => void;
}

export default function ClientModal({ onClose }: ClientModalProps) {
  const { user } = useAuth();
  const companyId = user?.id;

  const [phone, setPhone] = useState('');
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
    setLoading(true);
    setNotification(null);

    try {
      const res = await checkPreRegistered({ company_id: companyId, phone });
      if (res.data.pre_registered) {
        setNotification({
          type: 'error',
          message: 'Este cliente já está pré-registrado.',
        });
      } else {
        await preRegister({ company_id: companyId, phone });
        setNotification({
          type: 'success',
          message: 'Cliente pré-registrado com sucesso!',
        });
        setPhone('');
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

      <FloatingLabelInput
        id="client-phone"
        name="phone"
        label="Telefone do cliente"
        type="text"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        required
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

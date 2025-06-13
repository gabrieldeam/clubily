// src/components/ClientModal/ClientModal.tsx
'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { preRegister, checkPreRegistered } from '@/services/userService';
import { getCashbackPrograms } from '@/services/cashbackProgramService';
import { assignCashback } from '@/services/cashbackService';
import type { LeadCreate, UserRead } from '@/types/user';
import type { CashbackProgramRead } from '@/types/cashbackProgram';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import Notification from '@/components/Notification/Notification';
import Button from '@/components/Button/Button';
import styles from './ClientModal.module.css';

interface ClientModalProps {
  onClose: () => void;
}

export default function ClientModal({ onClose }: ClientModalProps) {
  const { user: company } = useAuth();
  const companyId = company?.id ?? '';

  // Passo 1: pré-cadastro
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: string; message: string } | null>(null);

  const [client, setClient] = useState<UserRead | null>(null);

  // Passo 2: listagem programas
  const [programs, setPrograms] = useState<CashbackProgramRead[]>([]);
  const [progLoading, setProgLoading] = useState(false);

  // Passo 3: associação
  const [selectedProg, setSelectedProg] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [assocNotification, setAssocNotification] = useState<{ type: string; message: string } | null>(null);

  const handlePre = async (e: FormEvent) => {
    e.preventDefault();
    setNotification(null);

    if (!companyId) {
      setNotification({ type: 'error', message: 'Empresa não autenticada.' });
      return;
    }
    const rawPhone = phone.replace(/\D/g, '');
    const rawCpf = cpf.replace(/\D/g, '');
    if (!rawPhone && !rawCpf) {
      setNotification({ type: 'error', message: 'Informe Telefone ou CPF.' });
      return;
    }

    setLoading(true);
    const params: LeadCreate = {
      company_id: companyId,
      phone: rawPhone || undefined,
      cpf: rawCpf || undefined,
    };

    try {
      // tenta verificar pré-cadastro existente
      const resCheck = await checkPreRegistered(params);
      setClient(resCheck.data);
      setNotification({ type: 'info', message: 'Cliente pré-registrado encontrado.' });
    } catch (err: any) {
      if (err.response?.status === 404) {
        // não existe: cria novo lead
        const resPre = await preRegister(params);
        setClient(resPre.data);
        setNotification({ type: 'success', message: 'Cliente pré-registrado com sucesso!' });
      } else {
        setNotification({ type: 'error', message: err.response?.data?.detail || 'Erro no pré-cadastro.' });
      }
    } finally {
      setLoading(false);
    }
  };

  // 2) buscar programas
  useEffect(() => {
    if (!client) return;
    setProgLoading(true);
    getCashbackPrograms()
      .then(r => setPrograms(r.data))
      .catch(console.error)
      .finally(() => setProgLoading(false));
  }, [client]);

  // 3) associar cashback
  const handleAssociate = async () => {
    setAssocNotification(null);
    if (!client?.id || !selectedProg || !amount) {
      setAssocNotification({ type: 'error', message: 'Escolha programa e informe valor gasto.' });
      return;
    }
    try {
      await assignCashback(client.id, { program_id: selectedProg, amount_spent: parseFloat(amount) });
      setAssocNotification({ type: 'success', message: 'Cashback associado com sucesso!' });
    } catch (err: any) {
      setAssocNotification({ type: 'error', message: err.response?.data?.detail || 'Erro ao associar.' });
    }
  };

  // Render
  if (!client) {
    return (
      <form className={styles.form} onSubmit={handlePre}>
        <h2 className={styles.title}>Pré-cadastrar Cliente</h2>
        {notification && (
          <Notification type={notification.type as any} message={notification.message} onClose={() => setNotification(null)} />
        )}
        <FloatingLabelInput
          id="client-phone"
          name="phone"
          label="Telefone"
          type="text"
          value={phone}
          onChange={e => setPhone(e.target.value)}
        />
        <div className={styles.separator}>e/ou</div>
        <FloatingLabelInput
          id="client-cpf"
          name="cpf"
          label="CPF"
          type="text"
          value={cpf}
          onChange={e => setCpf(e.target.value)}
        />
        <div className={styles.actions}>
          <Button type="submit" disabled={loading}>
            {loading ? 'Processando...' : 'OK'}
          </Button>
          <Button bgColor="#AAA" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className={styles.form}>
      <h2 className={styles.title}>Associar Cashback</h2>
      {assocNotification && (
        <Notification type={assocNotification.type as any} message={assocNotification.message} onClose={() => setAssocNotification(null)} />
      )}
      {progLoading ? (
        <p>Carregando programas...</p>
      ) : (
        <>
          <label className={styles.label}>Programa</label>
          <select className={styles.select} value={selectedProg} onChange={e => setSelectedProg(e.target.value)}>
            <option value="">-- escolha --</option>
            {programs.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.percent}%)
              </option>
            ))}
          </select>
          <FloatingLabelInput
            id="amount"
            name="amount"
            label="Valor gasto"
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
          <div className={styles.actions}>
            <Button onClick={handleAssociate}>Associar</Button>
            <Button bgColor="#AAA" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

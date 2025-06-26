// src/components/ClientModal/ClientModal.tsx
'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { preRegister, checkPreRegistered } from '@/services/userService';
import { getCashbackPrograms } from '@/services/cashbackProgramService';
import { assignCashback } from '@/services/cashbackService';
import { getUserWallet, withdrawUserWallet } from '@/services/walletService';
import type { LeadCreate, UserRead } from '@/types/user';
import type { CashbackProgramRead } from '@/types/cashbackProgram';
import type { UserWalletRead } from '@/types/wallet';
import { getUserProgramStats } from '@/services/cashbackProgramService';
import type { UserProgramStats } from '@/types/cashbackProgram';
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
  const { refresh: refreshCompanyWallet } = useWallet();  // <-- pull in context refresh

  // estados de pré-cadastro
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: string; message: string } | null>(null);
  const [client, setClient] = useState<UserRead | null>(null);

  // programas
  const [programs, setPrograms] = useState<CashbackProgramRead[]>([]);
  const [progLoading, setProgLoading] = useState(false);
  const [selectedProg, setSelectedProg] = useState<string>('');

  // estatísticas
  const [userStats, setUserStats] = useState<UserProgramStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // carteira do cliente
  const [userWallet, setUserWallet] = useState<UserWalletRead | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  // associação de cashback
  const [assocAmount, setAssocAmount] = useState('');
  const [assocNotification, setAssocNotification] = useState<{ type: string; message: string } | null>(null);

  // reset modal
  const handleReset = () => {
    setClient(null);
    setNotification(null);
    setPhone('');
    setCpf('');
    setPrograms([]);
    setSelectedProg('');
    setUserStats(null);
    setUserWallet(null);
    setAssocAmount('');
    setAssocNotification(null);
    setWithdrawAmount('');
    setWithdrawError(null);
    setLoading(false);
    setProgLoading(false);
    setStatsLoading(false);
    setWalletLoading(false);
    setWithdrawLoading(false);
  };

  // 1) Pré-cadastro
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
    const params: LeadCreate = { company_id: companyId, phone: rawPhone || undefined, cpf: rawCpf || undefined };
    try {
      const res = await checkPreRegistered(params);
      setClient(res.data);
      setNotification({ type: 'info', message: 'Cliente pré-registrado encontrado.' });
    } catch (err: any) {
      if (err.response?.status === 404) {
        const res = await preRegister(params);
        setClient(res.data);
        setNotification({ type: 'success', message: 'Cliente pré-registrado com sucesso!' });
      } else {
        setNotification({ type: 'error', message: err.response?.data?.detail || 'Erro no pré-cadastro.' });
      }
    } finally {
      setLoading(false);
    }
  };

  // 2) Fetch programas e carteira
  useEffect(() => {
    if (!client) return;
    setProgLoading(true);
    getCashbackPrograms()
      .then(r => setPrograms(r.data))
      .catch(console.error)
      .finally(() => setProgLoading(false));

    setWalletLoading(true);
    getUserWallet(client.id)
      .then(r => setUserWallet(r.data))
      .catch(console.error)
      .finally(() => setWalletLoading(false));
  }, [client]);

  // 3) Auto-seleciona primeiro programa
  useEffect(() => {
    if (programs.length > 0 && !selectedProg) {
      setSelectedProg(programs[0].id);
    }
  }, [programs]);

  // 4) Fetch estatísticas
  useEffect(() => {
    if (!client?.id) {
      setUserStats(null);
      return;
    }
    if (selectedProg) {
      setStatsLoading(true);
      getUserProgramStats(selectedProg, client.id)
        .then(r => setUserStats(r.data))
        .catch(console.error)
        .finally(() => setStatsLoading(false));
    }
  }, [client, selectedProg]);

  // 5) Associar cashback, atualizar carteira e contexto
  const handleAssociate = async () => {
    setAssocNotification(null);
    const value = parseFloat(assocAmount.replace(',', '.'));
    if (!client?.id || !selectedProg || isNaN(value) || value <= 0) {
      setAssocNotification({ type: 'error', message: 'Informe um valor de gasto válido e programa.' });
      return;
    }
    try {
      await assignCashback(client.id, { program_id: selectedProg, amount_spent: value });
      setAssocNotification({ type: 'success', message: 'Cashback associado!' });
      setAssocAmount('');

      // Re-fetch da carteira do cliente
      setWalletLoading(true);
      getUserWallet(client.id)
        .then(r => setUserWallet(r.data))
        .catch(console.error)
        .finally(() => setWalletLoading(false));

      // Atualiza também o saldo do cabeçalho via contexto
      refreshCompanyWallet();
    } catch (err: any) {
      setAssocNotification({ type: 'error', message: err.response?.data?.detail || 'Erro ao associar.' });
    }
  };

  // 6) Debitar da carteira
  const handleWithdraw = async () => {
    if (!client) return;
    const value = parseFloat(withdrawAmount.replace(',', '.'));
    if (isNaN(value) || value <= 0) {
      setWithdrawError('Informe um valor válido.');
      return;
    }
    setWithdrawLoading(true);
    setWithdrawError(null);
    try {
      const res = await withdrawUserWallet(client.id, { amount: value });
      setUserWallet(res.data);
      setWithdrawAmount('');

      // atualiza cabeçalho também
      refreshCompanyWallet();
    } catch (err: any) {
      setWithdrawError(err.response?.data?.detail || 'Erro ao debitar.');
    } finally {
      setWithdrawLoading(false);
    }
  };

  // Render inicial
  if (!client) {
    return (
      <form className={styles.form} onSubmit={handlePre}>
        <h2 className={styles.title}>Pré-cadastrar Cliente</h2>
        {notification && <Notification type={notification.type as any} message={notification.message} onClose={() => setNotification(null)} />}
        <FloatingLabelInput id="client-phone" name="phone" label="Telefone" type="text" value={phone} onChange={e => setPhone(e.target.value)} />
        <div className={styles.separator}>e/ou</div>
        <FloatingLabelInput id="client-cpf" name="cpf" label="CPF" type="text" value={cpf} onChange={e => setCpf(e.target.value)} />
        <div className={styles.actions}>
          <Button type="submit" disabled={loading}>{loading ? 'Processando…' : 'OK'}</Button>
          <Button bgColor="#AAA" onClick={onClose}>Cancelar</Button>
        </div>
      </form>
    );
  }

  // Render visão do cliente
  return (
    <div className={styles.form}>
      <h2 className={styles.title}>Visão do Cliente</h2>

      <div className={styles.userInfo}>
        <p><strong>Nome:</strong> {client.name}</p>
        <p><strong>E-mail:</strong> {client.email}</p>
        <p><strong>Telefone:</strong> {client.phone || '—'}</p>
        <p><strong>CPF:</strong> {client.cpf}</p>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Associar Cashback</h3>
        {progLoading ? <p>Carregando programas…</p> : (
          <>  
            <label className={styles.label}>Programa</label>
            <select className={styles.select} value={selectedProg} onChange={e => setSelectedProg(e.target.value)}>
              {programs.map(p => <option key={p.id} value={p.id}>{p.name} ({p.percent}%)</option>)}
            </select>
            <FloatingLabelInput id="assoc-amount" name="assocAmount" label="Valor gasto" type="number" value={assocAmount} onChange={e => setAssocAmount(e.target.value)} />
            <div className={styles.actions}>
              <Button onClick={handleAssociate}>Associar Cashback</Button>
            </div>
            {assocNotification && <Notification type={assocNotification.type as any} message={assocNotification.message} onClose={() => setAssocNotification(null)} />}
          </>
        )}
      </div>

      <div className={styles.walletCard}>
        <h3 className={styles.sectionTitle}>Carteira</h3>
        {walletLoading ? <p>Carregando saldo…</p> : userWallet ? (
          <>
            <div className={styles.balanceRow}><span>Saldo Atual:</span><strong>R$ {Number(userWallet.balance).toFixed(2)}</strong></div>
            <FloatingLabelInput id="withdraw-amount" name="withdrawAmount" label="Valor a debitar" type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} disabled={withdrawLoading} />
            <div className={styles.actions}><Button onClick={handleWithdraw} disabled={withdrawLoading}>{withdrawLoading ? 'Processando…' : 'Debitar'}</Button></div>
            {withdrawError && <Notification type="error" message={withdrawError} onClose={() => setWithdrawError(null)} />}
          </>
        ) : null}
      </div>

      <div className={styles.actions}>
        <Button bgColor="#AAA" onClick={handleReset}>Outro cadastro</Button>
      </div>
    </div>
  );
}

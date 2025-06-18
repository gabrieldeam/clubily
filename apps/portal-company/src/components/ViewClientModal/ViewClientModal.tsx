'use client';

import { useEffect, useState } from 'react';
import { getCashbackPrograms, getUserProgramStats } from '@/services/cashbackProgramService';
import type { CashbackProgramRead, UserProgramStats } from '@/types/cashbackProgram';
import type { UserRead } from '@/types/user';
import Notification from '@/components/Notification/Notification';
import Button from '@/components/Button/Button';
import styles from './ViewClientModal.module.css';

interface ViewClientModalProps {
  client: UserRead;
  onClose: () => void;
}

export default function ViewClientModal({ client, onClose }: ViewClientModalProps) {
  const [programs, setPrograms] = useState<CashbackProgramRead[]>([]);
  const [progLoading, setProgLoading] = useState(false);

  const [selectedProg, setSelectedProg] = useState('');
  const [stats, setStats] = useState<UserProgramStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // busca lista de programas
  useEffect(() => {
    setProgLoading(true);
    getCashbackPrograms()
      .then(r => setPrograms(r.data))
      .catch(err => setError('Falha ao carregar programas.'))
      .finally(() => setProgLoading(false));
  }, []);

  // ao trocar programa, busca estatísticas
  useEffect(() => {
    if (!selectedProg) {
      setStats(null);
      return;
    }
    setStatsLoading(true);
    getUserProgramStats(selectedProg, client.id)
      .then(r => setStats(r.data))
      .catch(err => setError('Falha ao carregar estatísticas.'))
      .finally(() => setStatsLoading(false));
  }, [selectedProg, client.id]);

  // formatadores
  const fmtPhone = (p?: string) => p?.trim() ? p : '—';
  const fmtCpf = (c: string, p?: string) => {
    if (!c.trim()) return '—';
    if (c.slice(-4) === p?.slice(-4)) return '*****';
    return c;
  };

  return (
    <div className={styles.form}>
      <h2 className={styles.title}>Dados do Cliente</h2>

      {error && (
        <Notification type="error" message={error} onClose={() => setError(null)} />
      )}

      <div className={styles.userInfo}>
        <p><strong>Nome:</strong> {client.name}</p>
        <p><strong>E-mail:</strong> {client.email}</p>
        <p><strong>Telefone:</strong> {fmtPhone(client.phone)}</p>
        <p><strong>CPF:</strong> {fmtCpf(client.cpf, client.phone)}</p>
      </div>

      <hr className={styles.divider} />

      <h3 className={styles.subTitle}>Estatísticas por Programa</h3>

      {progLoading ? (
        <p>Carregando programas…</p>
      ) : (
        <>
          <label htmlFor="view-prog" className={styles.label}>
            Selecione um programa
          </label>
          <select
            id="view-prog"
            className={styles.select}
            value={selectedProg}
            onChange={e => setSelectedProg(e.target.value)}
          >
            <option value="">— nenhum —</option>
            {programs.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.percent}%)
              </option>
            ))}
          </select>
        </>
      )}

      {statsLoading && <p>Carregando estatísticas…</p>}

      {stats && (
        <div className={styles.statsGroup}>
          <div className={styles.statsBox}>
            <h5>Todos os programas</h5>
            <p><strong>Usos válidos:</strong> {stats.company_valid_count}</p>
            <p><strong>Cashback total:</strong> R$ {stats.company_total_cashback.toFixed(2)}</p>
          </div>
          <div className={styles.statsBox}>
            <h5>Programa: {programs.find(p => p.id === selectedProg)?.name}</h5>
            <p><strong>Usos válidos:</strong> {stats.program_valid_count}</p>
            <p><strong>Cashback total:</strong> R$ {stats.program_total_cashback.toFixed(2)}</p>
          </div>
        </div>
      )}

      <div className={styles.actions}>
        <Button bgColor="#AAA" onClick={onClose}>Fechar</Button>
      </div>
    </div>
  );
}

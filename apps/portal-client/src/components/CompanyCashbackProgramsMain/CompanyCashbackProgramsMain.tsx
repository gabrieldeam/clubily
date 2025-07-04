// src/components/CompanyCashbackProgramsMain/CompanyCashbackProgramsMain.tsx
'use client';

import { useEffect, useState } from 'react';
import { listPublicCashbackProgramsByCompany } from '@/services/cashbackProgramService';
import type { CashbackProgramRead } from '@/types/cashbackProgram';
import styles from './CompanyCashbackProgramsMain.module.css';

interface Props {
  companyId: string;
}

export default function CompanyCashbackProgramsMain({ companyId }: Props) {
  const [programs, setPrograms] = useState<CashbackProgramRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    listPublicCashbackProgramsByCompany(companyId)
      .then(res => setPrograms(res.data))
      .catch(() => setError('Erro ao carregar programas.'))
      .finally(() => setLoading(false));
  }, [companyId]);

  if (loading || error || programs.length === 0) return null;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Programas de Cashback</h2>
      <div className={styles.grid}>
        {programs.map(p => (
          <div key={p.id} className={styles.card}>
            <div className={styles.header}>
              <h3 className={styles.name}>{p.name}</h3>
              <span className={styles.badge}>{p.percent}%</span>
            </div>
            {p.description && <p className={styles.desc}>{p.description}</p>}
            <div className={styles.meta}>
              <span>Validade: <strong>{p.validity_days} dia{p.validity_days > 1 && 's'}</strong></span>
              {p.max_per_user != null && (
                <span>Máx/usuário: <strong>{p.max_per_user}</strong></span>
              )}
              {p.min_cashback_per_user != null && (
                <span>Mínimo por usuário:<strong>R$ {p.min_cashback_per_user.toLocaleString('pt-BR')}</strong></span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
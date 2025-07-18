// src/components/RedeemRewardModal/RedeemRewardModal.tsx
'use client';

import { FormEvent, useState } from 'react';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import Button from '@/components/Button/Button';
import Notification from '@/components/Notification/Notification';
import axios from 'axios';

import { redeemReward } from '@/services/companyRewardsService';

import styles from './RedeemRewardModal.module.css';

interface Props {
  onClose: () => void;
  onRedeemed?: (message: string) => void;
}

export default function RedeemRewardModal({ onClose, onRedeemed }: Props) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
  e.preventDefault();
  if (!code.trim()) {
    setError('Informe o código');
    return;
  }

  setError(null);
  setSuccess(null);
  setLoading(true);

  try {
    const { data } = await redeemReward(code.trim());
    setSuccess(data.message);
    onRedeemed?.(data.message);
    setCode('');
  } catch (err: unknown) {
    // Erro Axios com campo detail
    if (axios.isAxiosError(err) && err.response?.data) {
      const payload = err.response.data as unknown;
      let msg: string | undefined;

      if (typeof payload === 'object' && payload !== null && 'detail' in payload) {
        const d = (payload as Record<string, unknown>).detail;
        if (typeof d === 'string') {
          msg = d;
        } else if (Array.isArray(d)) {
          msg = (d.filter(item => typeof item === 'string') as string[]).join('\n');
        }
      }

      setError(msg ?? err.message ?? 'Falha ao resgatar');
    }
    // Erro genérico
    else if (err instanceof Error) {
      setError(err.message);
    } else {
      setError('Falha ao resgatar');
    }
  } finally {
    setLoading(false);
  }
}


  return (
    <div className={styles.container}>
      <h2>Resgatar Recompensa</h2>

      {error && (
        <Notification
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}
      {success && (
        <Notification
          type="success"
          message={success}
          onClose={() => setSuccess(null)}
        />
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <FloatingLabelInput
          id="redeem-code"
          label="Código de Resgate"
          value={code}
          onChange={e => setCode(e.target.value)}
          required
        />

        <div className={styles.actions}>
          <Button type="submit" disabled={loading}>
            {loading ? 'Enviando…' : 'Resgatar'}
          </Button>
          <Button
            type="button"
            bgColor="#e5e7eb"
            style={{ color: '#1f2937' }}
            onClick={onClose}
          >
            Fechar
          </Button>
        </div>
      </form>
    </div>
  );
}

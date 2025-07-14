// src/components/RedeemRewardModal/RedeemRewardModal.tsx
'use client';

import { FormEvent, useState } from 'react';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import Button from '@/components/Button/Button';
import Notification from '@/components/Notification/Notification';

import { redeemReward } from '@/services/companyRewardsService';

import styles from './RedeemRewardModal.module.css';

interface Props {
  onClose: () => void;
  /** opcional: avisa quem chamou que o resgate foi concluído */
  onRedeemed?: (message: string) => void;
}

export default function RedeemRewardModal({ onClose, onRedeemed }: Props) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!code.trim()) return setError('Informe o código');
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const { data } = await redeemReward(code.trim());
      setSuccess(data.message);
      setCode('');
      onRedeemed?.(data.message);
      /* fecha modal alguns segundos depois, se preferir */
      // setTimeout(onClose, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Falha ao resgatar');
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

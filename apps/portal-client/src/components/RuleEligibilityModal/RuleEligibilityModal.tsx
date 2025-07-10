// src/components/RuleEligibilityModal/RuleEligibilityModal.tsx
'use client';

import { useEffect, useState } from 'react';
import type { PointsRuleRead, RuleStatusRead } from '@/types/pointsRule';
import Modal from '@/components/Modal/Modal';
import styles from './RuleEligibilityModal.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  rule: PointsRuleRead;
  checkRuleStatus: (ruleId: string) => Promise<{ data: RuleStatusRead }>;
}

export default function RuleEligibilityModal({
  open,
  onClose,
  rule,
  checkRuleStatus
}: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RuleStatusRead | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sempre que abrir, busca a elegibilidade
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setResult(null);

    checkRuleStatus(rule.id)
      .then(res => setResult(res.data))
      .catch(() => setError('Falha ao verificar elegibilidade.'))
      .finally(() => setLoading(false));
  }, [open, rule.id, checkRuleStatus]);

  return (
    <Modal open={open} onClose={onClose} width={500}>
      <div className={styles.content}>
        <h3>Checar elegibilidade: {rule.name}</h3>

        {loading && <p>Carregando...</p>}
        {error && <p className={styles.error}>{error}</p>}

        {result && (
          <div className={styles.result}>
            <p>
              <strong>Elegível?</strong> {result.already_awarded ? 'Sim' : 'Não'}
            </p>
            <p>
              <strong>Mensagem:</strong> {result.message}
            </p>
          </div>
        )}
        </div>
    </Modal>
  );
}

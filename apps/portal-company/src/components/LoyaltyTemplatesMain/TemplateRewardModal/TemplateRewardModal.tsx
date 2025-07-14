'use client';

import { useEffect, useState, FormEvent } from 'react';
import Button from '@/components/Button/Button';
import Notification from '@/components/Notification/Notification';

import { listRewards } from '@/services/companyRewardsService';
import {
  listTemplateRewards,
  attachRewardToTemplate,
  removeLink,
} from '@/services/companyRewardsService'; // ↔ onde você registrou as rotas acima

import type { RewardRead, LinkRead, LinkCreate } from '@/types/companyReward';

import styles from './TemplateRewardModal.module.css';

interface Props {
  tplId: string;
  onClose: () => void;
}

export default function TemplateRewardModal({ tplId, onClose }: Props) {
  /* ——————————————————— state ——————————————————— */
  const [links, setLinks] = useState<LinkRead[]>([]);
  const [rewards, setRewards] = useState<RewardRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* form para nova associação */
  const [rewardId, setRewardId] = useState('');
  const [stampNo, setStampNo] = useState<number>(1);

  /* ——————————————————— fetch initial ——————————————————— */
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [{ data: allRewards }, { data: tplLinks }] = await Promise.all([
          listRewards(),
          listTemplateRewards(tplId),
        ]);
        setRewards(allRewards);
        setLinks(tplLinks);
      } catch (err: any) {
        setError(err.message || 'Falha ao carregar recompensas');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [tplId]);

  /* ——————————————————— helpers ——————————————————— */
  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!rewardId) return alert('Selecione a recompensa');
    try {
      const payload: LinkCreate = { reward_id: rewardId, stamp_no: stampNo };
      await attachRewardToTemplate(tplId, payload);
      /* refresh */
      const { data } = await listTemplateRewards(tplId);
      setLinks(data);
      /* limpa form */
      setRewardId('');
      setStampNo(1);
    } catch (err: any) {
      setError(err.message || 'Falha ao associar recompensa');
    }
  }

  async function handleRemove(linkId: string) {
    if (!confirm('Remover esta associação?')) return;
    try {
      await removeLink(linkId);
      setLinks(prev => prev.filter(l => l.id !== linkId));
    } catch (err: any) {
      setError(err.message || 'Falha ao remover');
    }
  }

  /* ——————————————————— render ——————————————————— */
  return (
    <div className={styles.container}>
      <h2>Recompensas do Cartão</h2>

      {error && (
        <Notification
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {loading ? (
        <p>Carregando…</p>
      ) : (
        <>
          {/* lista existente */}
          <ul className={styles.linkList}>
            {links.map(link => {
              const reward = link.reward;
              return (
                <li key={link.id} className={styles.linkItem}>
                  <div>
                    <strong>{reward?.name || '—'}</strong> (carimbo&nbsp;
                    {link.stamp_no})
                  </div>
                  <Button
                    bgColor="#f87171"
                    onClick={() => handleRemove(link.id)}
                  >
                    Remover
                  </Button>
                </li>
              );
            })}
            {links.length === 0 && (
              <li className={styles.empty}>Nenhuma recompensa associada</li>
            )}
          </ul>

          {/* form nova associação */}
          <form onSubmit={handleAdd} className={styles.form}>
            <h3>Nova Associação</h3>

            <label className={styles.label}>Recompensa</label>
            <select
              value={rewardId}
              onChange={e => setRewardId(e.target.value)}
              required
            >
              <option value="">— selecione —</option>
              {rewards.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>

            <label className={styles.label}>Número do Carimbo</label>
            <input
              type="number"
              min={1}
              value={stampNo}
              onChange={e => setStampNo(Number(e.target.value))}
              required
            />

            <div className={styles.actions}>
              <Button type="submit">Adicionar</Button>
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
        </>
      )}
    </div>
  );
}

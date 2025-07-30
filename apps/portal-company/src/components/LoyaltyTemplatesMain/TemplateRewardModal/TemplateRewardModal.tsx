'use client';

import { useEffect, useState, FormEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Button from '@/components/Button/Button';
import Notification from '@/components/Notification/Notification';

import {
  listRewards,
  listTemplateRewards,
  attachRewardToTemplate,
  removeLink,
} from '@/services/companyRewardsService';

import type { RewardRead, LinkRead } from '@/types/companyReward';

import styles from './TemplateRewardModal.module.css';

interface Props {
  tplId: string;
  onClose: () => void;
}

export default function TemplateRewardModal({ tplId, onClose }: Props) {
  const router = useRouter();

  const [links, setLinks]     = useState<LinkRead[]>([]);
  const [rewards, setRewards] = useState<RewardRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const [rewardId, setRewardId] = useState('');
  const [stampNo, setStampNo]   = useState<number>(1);
  
   // ─── draft control ─────────────────────────────────────────────
  const DRAFT_KEY = `templateRewardModalDraft-${tplId}`;
  const isFirstRun = useRef(true);

  // 2) restaurar rascunho ao montar
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const { rewardId: dRid, stampNo: dStamp } = JSON.parse(draft);
        if (dRid) setRewardId(dRid);
        if (typeof dStamp === 'number') setStampNo(dStamp);
      } catch {}
    }
  }, [tplId, DRAFT_KEY]);

  // 3) salvar rascunho nas mudanças
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ rewardId, stampNo }));
  }, [rewardId, stampNo, tplId, DRAFT_KEY]);

  /* ------------------------------------------------------------------ */
  /* carregamento inicial                                               */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [{ data: allRewards }, { data: tplLinks }] = await Promise.all([
          listRewards(),
          listTemplateRewards(tplId),
        ]);
        setRewards(allRewards.filter(r => (r.stock_qty ?? 0) > 0));
        setLinks(tplLinks.filter(l => (l.reward.stock_qty ?? 0) > 0));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Falha ao carregar recompensas');
      } finally {
        setLoading(false);
      }
    })();
  }, [tplId]);

  /* ------------------------------------------------------------------ */
  /* util – extrai mensagem de erro do Axios                            */
  /* ------------------------------------------------------------------ */
 function extractMsg(err: unknown, fallback: string): string {
  if (!axios.isAxiosError(err)) {
    return fallback;
  }

  const data = err.response?.data;

  // 1) Se vier string pura
  if (typeof data === 'string') {
    return data;
  }

  // 2) Se vier objeto com campo "detail"
  if (data && typeof data === 'object' && 'detail' in data) {
    const detailProp = (data as Record<string, unknown>).detail;

    if (typeof detailProp === 'string') {
      return detailProp;
    }

    if (Array.isArray(detailProp)) {
      // concatena tudo como string
      return (detailProp as unknown[])
        .map(item => (typeof item === 'string' ? item : JSON.stringify(item)))
        .join('\n');
    }

    // se detailProp for um objeto com outro .detail dentro
    if (
      detailProp &&
      typeof detailProp === 'object' &&
      'detail' in detailProp &&
      typeof (detailProp as Record<string, unknown>).detail === 'string'
    ) {
      return (detailProp as { detail: string }).detail;
    }
  }

  // 3) Procura qualquer campo de texto no objeto
  if (data && typeof data === 'object') {
    const firstText = Object.values(data).find(v => typeof v === 'string');
    if (typeof firstText === 'string') {
      return firstText;
    }
  }

  // 4) Se nada funcionou, usa err.message (se for Error) ou fallback
  return err instanceof Error ? err.message : fallback;
}

  /* ------------------------------------------------------------------ */
  /* ações                                                               */
  /* ------------------------------------------------------------------ */
  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!rewardId) return setError('Selecione a recompensa');
    try {
      setError(null);
      await attachRewardToTemplate(tplId, { reward_id: rewardId, stamp_no: stampNo });
      const { data } = await listTemplateRewards(tplId);
      setLinks(data.filter(l => (l.reward.stock_qty ?? 0) > 0));
      // reset form **e limpa draft**
      setRewardId('');
      setStampNo(1);
      localStorage.removeItem(DRAFT_KEY);
    } catch (err) {
      setError(extractMsg(err, 'Falha ao associar recompensa'));
    }
  }

  async function handleRemove(linkId: string) {
    if (!confirm('Remover esta associação?')) return;

    try {
      setError(null);
      await removeLink(linkId);
      setLinks(prev => prev.filter(l => l.id !== linkId));
    } catch (err) {
      setError(extractMsg(err, 'Falha ao remover associação'));
    }
  }

  /* ------------------------------------------------------------------ */
  /* render                                                              */
  /* ------------------------------------------------------------------ */
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
          {links.length === 0 ? (
            <div className={styles.empty}>
              <p>Nenhuma recompensa associada.</p>
              <Button onClick={() => router.push('/register?section=reward')}>
                Cadastrar nova recompensa
              </Button>
            </div>
          ) : (
            <ul className={styles.linkList}>
              {links.map(link => (
                <li key={link.id} className={styles.linkItem}>
                  <div>
                    <strong>{link.reward.name}</strong> (carimbo {link.stamp_no})
                  </div>
                  <Button bgColor="#f87171" onClick={() => handleRemove(link.id)}>
                    Remover
                  </Button>
                </li>
              ))}
            </ul>
          )}

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

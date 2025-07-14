'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Notification from '@/components/Notification/Notification';
import {
  listTemplatesByCompany,
  claimLoyaltyCard,
} from '@/services/loyaltyService';
import type { TemplateRead } from '@/types/loyalty';
import styles from './LoyaltyTemplates.module.css';

interface Props {
  companyId: string;
}

export default function LoyaltyTemplates({ companyId }: Props) {
  const [templates, setTemplates]     = useState<TemplateRead[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [claimingId, setClaimingId]   = useState<string | null>(null);
  const [claimedMap, setClaimedMap]   = useState<Record<string, boolean>>({});

  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';

  /* ── fetch templates ─────────────────────────────────────────────── */
  useEffect(() => {
    setLoading(true);
    setError(null);
    listTemplatesByCompany(companyId)
      .then(res => setTemplates(res.data))
      .catch(err => {
        const msg = err.response?.data?.detail ?? 'Falha ao carregar cartões.';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [companyId]);

  /* ── claim card ──────────────────────────────────────────────────── */
  const handleClaim = async (tplId: string) => {
    if (claimedMap[tplId]) return;
    setClaimingId(tplId);
    try {
      await claimLoyaltyCard(tplId);
      setClaimedMap(prev => ({ ...prev, [tplId]: true }));
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? 'Algo deu errado ao resgatar o cartão.';
      setError(msg);
    } finally {
      setClaimingId(null);
    }
  };

  /* ── helpers ─────────────────────────────────────────────────────── */
  const imgSrc = (url?: string | null) =>
    url ? `${baseUrl}${url}` : '/placeholder.png';

  if (loading)  return <p className={styles.message}>Carregando cartões…</p>;
  if (!templates.length)
    return <p className={styles.message}>Nenhum cartão disponível.</p>;

  return (
    <div className={styles.whiteBox}>
      <h3 className={styles.sectionTitle}>Cartões Fidelidade</h3>
      {error && (
        <Notification
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      <div className={styles.grid}>
        {templates.map(tpl => {
          const claimed   = claimedMap[tpl.id];
          const isWorking = claimingId === tpl.id;

          return (
            <div
              key={tpl.id}
              className={styles.card}
              style={{
                background: tpl.color_bg ?? '#f9fafb',
                borderColor: tpl.color_primary ?? '#ffa600',
              }}
            >
              {/* header */}
              <header
                className={styles.cardHeader}
                style={{ background: tpl.color_primary ?? '#ffa600' }}
              >
                <h4>{tpl.title}</h4>
              </header>

              {/* icon */}
              <div className={styles.iconWrapper}>
                <Image
                  src={imgSrc(tpl.stamp_icon_url)}
                  alt="stamp icon"
                  width={56}
                  height={56}
                />
              </div>

              {/* promo text */}
              {tpl.promo_text && <p className={styles.promo}>{tpl.promo_text}</p>}

              {/* stamp row */}
              <div className={styles.stampRow}>
                {Array.from({ length: tpl.stamp_total }).map((_, i) => (
                  <span
                    key={i}
                    className={styles.stampCircle}
                    style={{ borderColor: tpl.color_primary ?? '#ffa600' }}
                  />
                ))}
              </div>

              {/* claim button */}
              <button
                className={styles.claimBtn}
                disabled={claimed || isWorking}
                onClick={() => handleClaim(tpl.id)}
              >
                {claimed ? 'Resgatado ✔' : isWorking ? 'Resgatando…' : 'Obter cartão'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

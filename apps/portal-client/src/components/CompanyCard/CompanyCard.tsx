'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Gift } from 'lucide-react';

import type { TemplateRead, RuleRead } from '@/types/loyalty';
import styles from '../WalletCard/WalletCard.module.css';   // reaproveite o mesmo CSS

/* ─── helpers ────────────────────────────────────────────── */
const lighten = (hex: string) => {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + 51);
  const g = Math.min(255, ((num >> 8) & 0xff) + 51);
  const b = Math.min(255, (num & 0xff) + 51);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
};

function getConfigText(rule: RuleRead): string {
  const cfg = rule.config;
  switch (rule.rule_type) {
    case 'purchase_amount':
      return `Ganhe um carimbo para compras a partir de R$ ${cfg.amount}`;
    case 'visit': {
      const v = cfg.visits ?? 1;
      return `Ganhe um carimbo a cada ${v} visita${v > 1 ? 's' : ''}`;
    }
    case 'service_done':
      return `Ganhe um carimbo ao realizar o serviço de ID ${cfg.service_id}`;
    case 'product_bought':
      return `Ganhe um carimbo na compra de produtos selecionados`;
    case 'category_bought':
      return `Ganhe um carimbo na compra em categorias selecionadas`;
    case 'custom_event':
      return `Ganhe um carimbo ao disparar o evento “${cfg.event_name}”`;
    default:
      return JSON.stringify(cfg);
  }
}

/* ─── Componente ─────────────────────────────────────────── */
interface Props {
  template: TemplateRead;
}

export default function CompanyCard({ template }: Props) {
  const router  = useRouter();
  const primary = template.color_primary ?? '#4f46e5';
  const bg      = template.color_bg     ?? '#f9fafb';
  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';

  const total = template.stamp_total;

  return (
    <div
      className={styles.card}
      onClick={() => router.push(`/companies/${template.company_id}`)}
      style={{ cursor: 'pointer', borderColor: primary, background: primary }}
    >
      {/* ─── Lado esquerdo ─────────────────────────────── */}
      <div className={styles.leftPane} style={{ background: primary }}>
        <div className={styles.headerTop}>
          <h4 className={styles.title}>{template.title}</h4>
          <Image
            src={`${baseUrl}${template.stamp_icon_url ?? ''}`}
            alt="icon"
            width={40}
            height={40}
          />
        </div>

        <div
          className={styles.headerBottom}
          style={{ background: lighten(bg) }}
        >
          <p className={styles.promo}>{template.promo_text}</p>
        </div>
      </div>

      {/* ─── Lado direito ──────────────────────────────── */}
      <div className={styles.rightPane} style={{ background: bg }}>
        {/* grade de carimbos */}
        <div className={styles.stampsGridSimpleCard}>
          {(() => {
            const maxDisplay   = 8;
            const displayCount = Math.min(total, maxDisplay);

            return Array.from({ length: displayCount }).map((_, idx) => {
              const pos = idx + 1;

              if (idx === maxDisplay - 1 && total > maxDisplay) {
                const remaining = total - (maxDisplay - 1);
                return (
                  <div
                    key="more"
                    className={styles.stampCircle}
                    style={{ border: `2px solid ${primary}`, cursor: 'default' }}
                  >
                    <span className={styles.moreText}>+{remaining}</span>
                  </div>
                );
              }

              const hasReward = template.rewards_map.some(r => r.stamp_no === pos);

              return (
                <div
                  key={pos}
                  className={styles.stampCircle}
                  style={{ border: `2px solid ${primary}` }}
                >
                  {hasReward ? (
                    <Gift size={24} />
                  ) : (
                    <Image
                      src={`${baseUrl}${template.stamp_icon_url ?? ''}`}
                      alt="stamp"
                      fill
                      className={styles.desat}   // mesma classe usada no SimpleCard
                    />
                  )}
                </div>
              );
            });
          })()}
        </div>

        {/* assinatura / regras */}
        <div className={styles.ownerSignatureWrapper}>
          <span>Empresa:</span>
          <div className={styles.ownerName}>{template.company.name}</div>
          <div className={styles.signatureLine} />

          {template.rules.length > 0 && (
            <div className={styles.rulesContainer}>
              {template.rules.map(rule => (
                <p key={rule.id} className={styles.ruleText}>
                  {getConfigText(rule)}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className={styles.expiry}>
          Expira{' '}
          {template.emission_end
            ? new Date(template.emission_end).toLocaleDateString('pt-BR')
            : '—'}
        </div>
      </div>
    </div>
  );
}

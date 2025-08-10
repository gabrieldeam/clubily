'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Gift } from 'lucide-react';
import Modal from '../Modal/Modal';
import WalletCard from '../WalletCard/WalletCard';
import type { InstanceDetail, RuleRead, TemplateReadFull } from '@/types/loyalty';
import styles from '../WalletCard/WalletCard.module.css';

const lighten = (hex: string) => {
  const safe = hex || '#f9fafb';
  const num = parseInt(safe.replace('#', ''), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + 51);
  const g = Math.min(255, ((num >> 8) & 0xff) + 51);
  const b = Math.min(255, (num & 0xff) + 51);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
};

function getConfigText(rule: RuleRead): string {
  const cfg = rule.config as any;
  switch (rule.rule_type) {
    case 'purchase_amount':
      return `Ganhe um carimbo para compras a partir de R$ ${cfg?.amount ?? 0}`;
    case 'visit': {
      const v = Number(cfg?.visits ?? 1);
      return `Ganhe um carimbo a cada ${v} visita${v > 1 ? 's' : ''}`;
    }
    case 'service_done':
      return `Ganhe um carimbo ao realizar o serviço de ID ${cfg?.service_id ?? '—'}`;
    case 'product_bought':
      return `Ganhe um carimbo na compra de produtos selecionados`;
    case 'category_bought':
      return `Ganhe um carimbo na compra em categorias selecionadas`;
    case 'custom_event':
      return `Ganhe um carimbo ao disparar o evento “${cfg?.event_name ?? '—'}”`;
    default:
      return JSON.stringify(cfg ?? {});
  }
}

/** VARIANTE 1: instância de cartão do usuário */
type InstanceVariantProps = {
  card: InstanceDetail;
  disableModal?: boolean;
  /** nome do dono a ser exibido no rodapé do cartão */
  ownerName?: string;
};

/** VARIANTE 2: card de template disponível (sem progresso) + CTA */
type TemplateVariantProps = {
  template: TemplateReadFull;
  ctaLabel?: string;
  onCta?: () => void;
};

type Props = InstanceVariantProps | TemplateVariantProps;

function isInstanceVariant(p: Props): p is InstanceVariantProps {
  return (p as InstanceVariantProps).card !== undefined;
}

export default function SimpleCard(props: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';

  if (isInstanceVariant(props)) {
    const { card, disableModal = false, ownerName } = props;
    const tpl = card.template;
    const primary = tpl.color_primary ?? '#4f46e5';
    const bg = tpl.color_bg ?? '#f9fafb';

    const total = tpl.stamp_total;
    const given = new Set(card.stamps.map(s => s.stamp_no));

    return (
      <>
        <div className={styles.cardContainer}>
          <div
            className={styles.card}
            onClick={() => !disableModal && setIsOpen(true)}
            style={{
              cursor: disableModal ? 'default' : 'pointer',
              borderColor: primary,
              background: primary,
            }}
          >
            <div className={styles.leftPane} style={{ background: primary }}>
              <div className={styles.headerTop}>
                <h4 className={styles.title}>{tpl.title}</h4>
                {tpl.stamp_icon_url && (
                  <Image
                    src={`${baseUrl}${tpl.stamp_icon_url}`}
                    alt="icon"
                    width={40}
                    height={40}
                  />
                )}
              </div>
              <div className={styles.headerBottom} style={{ background: lighten(bg) }}>
                <p className={styles.promo}>{tpl.promo_text}</p>
              </div>
            </div>

            <div className={styles.rightPane} style={{ background: bg }}>
              <div className={styles.stampsGridSimpleCard}>
                {(() => {
                  const maxDisplay = 8;
                  const displayCount = Math.min(total, maxDisplay);
                  return Array.from({ length: displayCount }).map((_, idx) => {
                    const pos = idx + 1;

                    if (idx === maxDisplay - 1 && total > maxDisplay) {
                      const remaining = total - (maxDisplay - 1);
                      return (
                        <div
                          key="more"
                          className={styles.stampCircle}
                          style={{ cursor: 'default', border: `2px solid ${primary}` }}
                        >
                          <span className={styles.moreText}>+{remaining}</span>
                        </div>
                      );
                    }

                    const hasReward = tpl.rewards_map.some(r => r.stamp_no === pos);
                    const earned = given.has(pos);

                    return (
                      <div
                        key={pos}
                        className={styles.stampCircle}
                        style={{ border: earned ? `2px solid ${primary}` : undefined }}
                      >
                        {earned ? (
                          tpl.stamp_icon_url ? (
                            <Image src={`${baseUrl}${tpl.stamp_icon_url}`} alt="stamp" fill />
                          ) : null
                        ) : hasReward ? (
                          <Gift size={24} />
                        ) : tpl.stamp_icon_url ? (
                          <Image
                            src={`${baseUrl}${tpl.stamp_icon_url}`}
                            alt="stamp"
                            fill
                            className={styles.desat}
                          />
                        ) : (
                          <Gift size={20} />
                        )}
                      </div>
                    );
                  });
                })()}
              </div>

              <div className={styles.ownerSignatureWrapper}>
                <span>Este cartão pertence a:</span>
                <div className={styles.ownerName}>{ownerName ?? '—'}</div>
                <div className={styles.signatureLine} />
                {tpl.rules.length > 0 && (
                  <div className={styles.rulesContainer}>
                    {tpl.rules.map((rule: RuleRead) => (
                      <p key={rule.id} className={styles.ruleText}>
                        {getConfigText(rule)}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {!disableModal && (
          <Modal open={isOpen} onClose={() => setIsOpen(false)} width={750}>
            <WalletCard card={card} />
          </Modal>
        )}
      </>
    );
  }

  // —— TEMPLATE MODE ——
  const { template: tpl, onCta, ctaLabel = 'Emitir' } = props as TemplateVariantProps;
  const primary = tpl.color_primary ?? '#4f46e5';
  const bg = tpl.color_bg ?? '#f9fafb';
  const total = tpl.stamp_total;

  return (
    <div className={styles.cardContainer}>
      <div
        className={styles.card}
        style={{
          cursor: 'default',
          borderColor: primary,
          background: primary,
        }}
      >
        <div className={styles.leftPane} style={{ background: primary }}>
          <div className={styles.headerTop}>
            <h4 className={styles.title}>{tpl.title}</h4>
            {tpl.stamp_icon_url && (
              <Image
                src={`${baseUrl}${tpl.stamp_icon_url}`}
                alt="icon"
                width={40}
                height={40}
              />
            )}
          </div>
          <div className={styles.headerBottom} style={{ background: lighten(bg) }}>
            <p className={styles.promo}>{tpl.promo_text}</p>
          </div>
        </div>

        <div className={styles.rightPane} style={{ background: bg }}>
          <div className={styles.stampsGridSimpleCard}>
            {(() => {
              const maxDisplay = 8;
              const displayCount = Math.min(total, maxDisplay);
              return Array.from({ length: displayCount }).map((_, idx) => {
                const pos = idx + 1;

                if (idx === maxDisplay - 1 && total > maxDisplay) {
                  const remaining = total - (maxDisplay - 1);
                  return (
                    <div
                      key="more"
                      className={styles.stampCircle}
                      style={{ cursor: 'default', border: `2px solid ${primary}` }}
                    >
                      <span className={styles.moreText}>+{remaining}</span>
                    </div>
                  );
                }

                const hasReward = tpl.rewards_map.some(r => r.stamp_no === pos);

                return (
                  <div key={pos} className={styles.stampCircle}>
                    {hasReward ? (
                      <Gift size={24} />
                    ) : tpl.stamp_icon_url ? (
                      <Image
                        src={`${baseUrl}${tpl.stamp_icon_url}`}
                        alt="stamp"
                        fill
                        className={styles.desat}
                      />
                    ) : (
                      <Gift size={20} />
                    )}
                  </div>
                );
              });
            })()}
          </div>

          {tpl.rules.length > 0 && (
            <div className={styles.rulesContainer} style={{ marginTop: 8 }}>
              {tpl.rules.map((rule: RuleRead) => (
                <p key={rule.id} className={styles.ruleText}>
                  {getConfigText(rule)}
                </p>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
            <button
              onClick={onCta}
              style={{
                padding: '10px 16px',
                borderRadius: 12,
                border: 'none',
                background: '#FF4C00',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 600,
                width: '100%',
              }}
              title="Emitir cartão para este cliente"
            >
              {ctaLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

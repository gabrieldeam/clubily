'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Gift } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { InstanceDetail, RuleRead, RewardRedemptionRead } from '@/types/loyalty';
import styles from './WalletCard.module.css';

interface Props {
  card: InstanceDetail;
}

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
      const { visits } = cfg as { visits?: number };
      const v = visits ?? 1;
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

export default function WalletCard({ card }: Props) {
  const { user } = useAuth();

  // estado local para refletir carimbos caso o pai reabra/atualize
  const [stateCard, setStateCard] = useState<InstanceDetail>(card);
  useEffect(() => setStateCard(card), [card]);

  const tpl = stateCard.template;
  const primary = tpl.color_primary ?? '#4f46e5';
  const bg = tpl.color_bg ?? '#f9fafb';
  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';

  const total = tpl.stamp_total;
  const given = new Set(stateCard.stamps.map(s => s.stamp_no));

  const [redemptions] = useState<RewardRedemptionRead[]>(stateCard.redemptions);

  return (
    <div className={styles.cardContainer}>

      {/* Empresa */}
      <div className={styles.companyCard}>
        <div className={styles.companyInfo}>
          {tpl.company.logo_url ? (
            <Image
              src={`${baseUrl}${tpl.company.logo_url}`}
              alt={tpl.company.name}
              width={60}
              height={60}
              className={styles.companyLogo}
            />
          ) : (
            <div className={styles.companyLogo}>
              {tpl.company.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className={styles.companyDetails}>
            <h5 className={styles.companyName}>{tpl.company.name}</h5>
          </div>
        </div>
      </div>

      {/* Card principal */}
      <div
        className={styles.cardMain}
        style={{
          borderLeftColor: primary,
          background: `linear-gradient(to right, ${lighten(bg)} 0%, ${bg} 30%)`,
        }}
      >
        <div
          className={styles.card}
          style={{ borderColor: primary, background: primary }}
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
            <div
              className={styles.headerBottom}
              style={{ background: lighten(bg) }}
            >
              <p className={styles.promo}>{tpl.promo_text}</p>
            </div>
          </div>
          <div className={styles.rightPane} style={{ background: bg }}>
            <div className={styles.stampsGrid}>
              {Array.from({ length: total }).map((_, idx) => {
                const pos = idx + 1;
                const hasReward = tpl.rewards_map.some(r => r.stamp_no === pos);
                const earned = given.has(pos);
                return (
                  <div
                    key={pos}
                    className={styles.stampCircle}
                    style={{
                      border: earned ? `2px solid ${primary}` : undefined,
                    }}
                  >
                    {earned ? (
                      tpl.stamp_icon_url ? (
                        <Image
                          src={`${baseUrl}${tpl.stamp_icon_url}`}
                          alt="stamp"
                          fill
                        />
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
              })}
            </div>

            <div className={styles.ownerSignatureWrapper}>
              <span>Este cartão pertence a:</span>
              <div className={styles.ownerName}>
                {user?.name ?? '—'}
              </div>
              <div className={styles.signatureLine} />
            </div>
          </div>
        </div>
      </div>

      {/* Footer + regras */}
      <div className={styles.cardFooter}>
        <div>
          <span>Emitido em: {new Date(stateCard.issued_at).toLocaleDateString('pt-BR')}</span>
        </div>

        <div>
          {tpl.rules.length > 0 && (
            <div className={styles.rules}>
              {tpl.rules.map(rule => (
                <span key={rule.id} className={styles.rule}>
                  {getConfigText(rule)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Prêmios apenas informativos */}
      {tpl.rewards_map.length > 0 && (
        <div className={styles.rewardsSection}>
          <h4 className={styles.rewardsTitle}>Prêmios</h4>
          <div className={styles.rewardsGrid}>
            {tpl.rewards_map.map(link => {
              const ready = stateCard.stamps_given >= link.stamp_no;
              const isClaimed = redemptions.some(r => r.link_id === link.id && r.used);

              return (
                <div key={link.id} className={styles.rewardItem}>
                  <div className={styles.rewardIcon}>
                    {link.reward.image_url ? (
                      <Image
                        src={`${baseUrl}${link.reward.image_url}`}
                        alt={link.reward.name}
                        width={48}
                        height={48}
                      />
                    ) : (
                      <Gift size={24} />
                    )}
                  </div>
                  <div className={styles.rewardInfo}>
                    <h5>{link.reward.name}</h5>
                    <p>No carimbo {link.stamp_no}</p>
                  </div>
                  <div className={styles.rewardStatus}>
                    {isClaimed ? (
                      <span className={styles.claimed}>Resgatado</span>
                    ) : ready ? (
                      <span className={styles.pending} title="Disponível quando o cliente solicitar">
                        Disponível
                      </span>
                    ) : (
                      <span className={styles.pending}>Pendente</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

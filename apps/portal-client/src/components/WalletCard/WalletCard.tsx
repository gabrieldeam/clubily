// src/components/WalletCard/WalletCard.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Gift, Check } from 'lucide-react';
import type { InstanceDetail, RuleRead } from '@/types/loyalty';
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

export default function WalletCard({ card }: Props) {
  const tpl = card.template;
  const primary = tpl.color_primary ?? '#4f46e5';
  const bg = tpl.color_bg ?? '#f9fafb';
  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';
  const [claimedRewards, setClaimedRewards] = useState<Record<string, boolean>>({});

  const isCompleted = card.completed_at !== null;
  const hasUnclaimedReward = isCompleted && !card.reward_claimed;

  // agrupa em filas de 6
  const stampsPerRow = 6;
  const total = tpl.stamp_total;
  const rows = Math.ceil(total / stampsPerRow);
  const given = new Set(card.stamps.map(s => s.stamp_no));
  const rewardMap = tpl.rewards_map.reduce<Record<number,string>>((m, link) => {
    m[link.stamp_no] = link.id;
    return m;
  }, {});

  const handleRewardClick = (id: string) => {
    setClaimedRewards(prev => ({ ...prev, [id]: true }));
    // aqui chamaria API de resgate...
  };

  return (
    <div className={styles.cardContainer}>
      {/* === Card principal (header + círculos) === */}
      <div
        className={styles.cardMain}
        style={{
          borderLeftColor: primary,
          background: `linear-gradient(to right, ${lighten(bg)} 0%, ${bg} 30%)`,
        }}
      >
        <div className={styles.headerLeft}>
          <div className={styles.cardIcon}>
            {tpl.stamp_icon_url
              ? <Image src={`${baseUrl}${tpl.stamp_icon_url}`} alt="" width={32} height={32} />
              : <Gift size={20} />}
          </div>
          <div className={styles.headerText}>
            <h3 className={styles.cardTitle}>{tpl.title}</h3>
            {tpl.promo_text && <p className={styles.cardDesc}>{tpl.promo_text}</p>}
          </div>
        </div>
        <div className={styles.headerRight}>
          {[...Array(rows)].map((_, r) => {
            const start = r * stampsPerRow + 1;
            const end = Math.min(start + stampsPerRow - 1, total);
            return (
              <div key={r} className={styles.stampRow}>
                {Array.from({ length: end - start + 1 }).map((_, i) => {
                  const no = start + i;
                  const givenFlag = given.has(no);
                  const rewardId = rewardMap[no];
                  const claimed = rewardId ? claimedRewards[rewardId] : false;
                  return (
                    <div
                      key={no}
                      className={`${styles.stampCircle} ${givenFlag ? styles.given : ''}`}
                      onClick={() => rewardId && !claimed && handleRewardClick(rewardId)}
                    >
                      {givenFlag && tpl.stamp_icon_url
                        ? <Image src={`${baseUrl}${tpl.stamp_icon_url}`} alt="" fill className={styles.stampImg} />
                        : <div className={styles.stampPlaceholder} />
                      }
                      {rewardId && (
                        <div className={styles.rewardBadge}>
                          {claimed ? <Check size={12} /> : <Gift size={12} />}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* === Footer de expiração e botão de resgate (fora do cardMain) === */}
      <div className={styles.cardFooter}>
        <span>Emitido em: {new Date(card.issued_at).toLocaleDateString('pt-BR')}</span>
        {card.expires_at && (
          <span> | Expira em: {new Date(card.expires_at).toLocaleDateString('pt-BR')}</span>
        )}
        {hasUnclaimedReward && (
          <button className={styles.claimButton}>Resgatar prêmio</button>
        )}
      </div>

      {/* === Recompensas disponíveis (fora do cardMain) === */}
      {tpl.rewards_map.length > 0 && (
        <div className={styles.rewardsSection}>
          <h4 className={styles.rewardsTitle}>Prêmios disponíveis</h4>
          <div className={styles.rewardsGrid}>
            {tpl.rewards_map.map(link => {
              const claimed = claimedRewards[link.id];
              const ready = card.stamps_given >= link.stamp_no;
              return (
                <div key={link.id} className={styles.rewardItem}>
                  <div className={styles.rewardIcon}>
                    {link.reward.image_url
                      ? <Image src={`${baseUrl}${link.reward.image_url}`} alt="" width={48} height={48} />
                      : <Gift size={24} />}
                  </div>
                  <div className={styles.rewardInfo}>
                    <h5>{link.reward.name}</h5>
                    <p>No carimbo {link.stamp_no}</p>
                  </div>
                  <div className={styles.rewardStatus}>
                    {claimed
                      ? <span className={styles.claimed}>Resgatado</span>
                      : ready
                        ? <button className={styles.claimSmallButton} onClick={() => handleRewardClick(link.id)}>Resgatar</button>
                        : <span className={styles.pending}>Pendente</span>
                    }
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

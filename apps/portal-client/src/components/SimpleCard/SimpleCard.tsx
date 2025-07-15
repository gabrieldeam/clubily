'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Gift } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Modal from '../Modal/Modal';
import WalletCard from '../WalletCard/WalletCard';
import type { InstanceDetail, RuleRead } from '@/types/loyalty';
import styles from '../WalletCard/WalletCard.module.css';

const lighten = (hex: string) => {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + 51);
  const g = Math.min(255, ((num >> 8) & 0xff) + 51);
  const b = Math.min(255, (num & 0xff) + 51);
  return `#${((r << 16) | (g << 8) | b)
    .toString(16)
    .padStart(6, '0')}`;
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

interface Props {
  card: InstanceDetail;
}

export default function SimpleCard({ card }: Props) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const tpl = card.template;
  const primary = tpl.color_primary ?? '#4f46e5';
  const bg = tpl.color_bg ?? '#f9fafb';
  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';

  const total = tpl.stamp_total;
  const given = new Set(card.stamps.map(s => s.stamp_no));  

  return (
    <>
    <div className={styles.cardContainer}>
      <div className={styles.companyCard}>
        <div className={styles.companyInfo}>
          {tpl.company.logo_url
            ? (
              <Image
                src={`${baseUrl}${tpl.company.logo_url}`}
                alt={tpl.company.name}
                width={60}
                height={60}
                className={styles.companyLogo}
              />
            )
            : (
              <div className={styles.companyLogo}>
                {tpl.company.name.charAt(0).toUpperCase()}
              </div>
            )
          }
          <div className={styles.companyDetails}>
            <h5 className={styles.companyName}>{tpl.company.name}</h5>            
            <p className={styles.companyContact}>
              {tpl.company.email} • {tpl.company.phone}
            </p>
            <p className={styles.companyCNPJ}>CNPJ: {tpl.company.cnpj}</p>
          </div>
        </div>
        <Link
          href={`/companies/${tpl.company.id}`}
          className={styles.companyButton}
        >
          Ver empresa
        </Link>
      </div>
      <div
        className={styles.card}
        onClick={() => setIsOpen(true)}
        style={{
          cursor: 'pointer',
          borderColor: primary,
          background: primary,
        }}
      >
        <div className={styles.leftPane} style={{ background: primary }}>
          <div className={styles.headerTop}>
            <h4 className={styles.title}>{tpl.title}</h4>
            <Image
              src={`${baseUrl}${tpl.stamp_icon_url ?? ''}`}
              alt="icon"
              width={40}
              height={40}
            />
          </div>
          <div
            className={styles.headerBottom}
            style={{ background: lighten(bg) }}
          >
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
                        <Image
                          src={`${baseUrl}${tpl.stamp_icon_url ?? ''}`}
                          alt="stamp"
                          fill
                        />
                      ) : hasReward ? (
                        <Gift size={24} />
                      ) : (
                        <Image
                          src={`${baseUrl}${tpl.stamp_icon_url ?? ''}`}
                          alt="stamp"
                          fill
                          className={styles.desat}
                        />
                      )}
                    </div>
                );
                });
            })()}
          </div>

          <div className={styles.ownerSignatureWrapper}>
            <span>Este cartão pertence a:</span>
            <div className={styles.ownerName}>
              {user?.name ?? '—'}
            </div>
            <div className={styles.signatureLine} />
            {tpl.rules.length > 0 && (
              <div className={styles.rulesContainer}>
                {tpl.rules.map(rule => (
                  <p key={rule.id} className={styles.ruleText}>
                    {getConfigText(rule)}
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className={styles.expiry}>
            Expira{' '}
            {tpl.emission_end
              ? new Date(tpl.emission_end).toLocaleDateString('pt-BR')
              : '—'}
          </div>
        </div>
      </div>
    </div>

      <Modal open={isOpen} onClose={() => setIsOpen(false)} width={750}>
        <WalletCard card={card} />
      </Modal>
    </>
  );
}

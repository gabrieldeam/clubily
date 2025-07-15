// src/components/LoyaltyTemplates/LoyaltyTemplates.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Notification from '@/components/Notification/Notification';
import Modal from '@/components/Modal/Modal';
import Button from '@/components/Button/Button';
import { Gift } from 'lucide-react';
import { listTemplatesByCompany, claimLoyaltyCard } from '@/services/loyaltyService';
import { useAuth } from '@/context/AuthContext';
import type { TemplateRead, RuleRead} from '@/types/loyalty';
import styles from './LoyaltyTemplates.module.css';

interface Props {
  companyId: string;
}

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

export default function LoyaltyTemplates({ companyId }: Props) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<TemplateRead[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimedMap, setClaimedMap] = useState<Record<string, boolean>>({});
  const [limitExceededMap, setLimitExceededMap] = useState<Record<string, boolean>>({});
  const [showNameFor, setShowNameFor] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTpl, setModalTpl] = useState<TemplateRead | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';

  useEffect(() => {
    setError(null);
    listTemplatesByCompany(companyId)
      .then(res => setTemplates(res.data))
      .catch(err => setError(err.response?.data?.detail ?? 'Falha ao carregar cartões.'))
  }, [companyId]);

  const handleClaim = async (tplId: string) => {
    if (claimedMap[tplId] || limitExceededMap[tplId]) return;
    setClaimingId(tplId);
    try {
      await claimLoyaltyCard(tplId);
      setClaimedMap(prev => ({ ...prev, [tplId]: true }));
      setShowNameFor(tplId);
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? 'Erro ao resgatar o cartão.';
      if (msg === 'Limite por usuário excedido') {
        setLimitExceededMap(prev => ({ ...prev, [tplId]: true }));
      } else {
        setError(msg);
      }
    } finally {
      setClaimingId(null);
    }
  };

  const openModal = (tpl: TemplateRead) => {
    setModalTpl(tpl);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalTpl(null);
  };

  const lighten = (hex: string) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, ((num >> 16) & 0xff) + 51);
    const g = Math.min(255, ((num >> 8) & 0xff) + 51);
    const b = Math.min(255, (num & 0xff) + 51);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  };

  if (templates.length === 0) return null;
  
  return (
    <div className={styles.whiteBox}>
      <h3 className={styles.sectionTitle}>Cartões Fidelidade</h3>
      {error && error !== 'Limite por usuário excedido' && (
        <Notification type="error" message={error} onClose={() => setError(null)} />
      )}
      <div className={styles.grid}>
        {templates.map(tpl => {
          const claimed = claimedMap[tpl.id];
          const isWorking = claimingId === tpl.id;
          const limitExceeded = limitExceededMap[tpl.id];
          const total = tpl.stamp_total;
          const stampsPerRow = 7;
          const extra = total > stampsPerRow ? `+${total - stampsPerRow}` : '';
          const primary = tpl.color_primary ?? undefined;
          const bg = tpl.color_bg ?? '#f9fafb';

          return (
            <div key={tpl.id} className={styles.itemWrapper}>
              <div
                className={styles.card}
                onClick={() => openModal(tpl)}
                style={{ borderColor: primary, background: primary }}
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
                    <div className={styles.stampsGrid}>
                      {Array.from({ length: stampsPerRow }).map((_, i) => {
                        const pos = i + 1;
                        const hasReward = tpl.rewards_map.some(r => r.stamp_no === pos);
                        return (
                          <div key={pos} className={styles.stampCircle}>
                            {hasReward ? (
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
                      })}
                      {extra && <div className={styles.stampExtra}>{extra}</div>}
                    </div>
                     <div className={styles.ownerSection}>
                      <span>Este cartão pertence a:</span>
                        <div className={styles.ownerSignatureWrapper}>
                          <div
                            className={`${styles.ownerName} ${
                              (showNameFor === tpl.id || limitExceeded)
                                ? styles.writeAnim
                                : ''
                            }`}
                          >
                            {(showNameFor === tpl.id || limitExceeded) && user?.name}
                          </div>
                          <div className={styles.signatureLine} />
                        </div>
                    </div>
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
              <Button
                onClick={() => handleClaim(tpl.id)}
                disabled={claimed || isWorking || limitExceeded}
                bgColor={primary}
                style={{ marginTop: 8 }}
              >
                {limitExceeded
                  ? 'Limite por usuário excedido'
                  : claimed
                  ? 'Resgatado ✔'
                  : isWorking
                  ? 'Resgatando…'
                  : 'Obter cartão'}
              </Button>
            </div>
          );
        })}
      </div>

<Modal open={modalOpen} onClose={closeModal} width={700}>
  {modalTpl && (
    <div className={styles.itemWrapperModal}>
      <div
        className={styles.card}
        style={{
          borderColor: modalTpl.color_primary ?? undefined,
          background: modalTpl.color_primary ?? undefined,
        }}
      >
        {/* === Left Pane === */}
        <div
          className={styles.leftPane}
          style={{ background: modalTpl.color_primary ?? undefined }}
        >
          <div className={styles.headerTop}>
            <h4 className={styles.title}>{modalTpl.title}</h4>
            <Image
              src={`${baseUrl}${modalTpl.stamp_icon_url ?? ''}`}
              alt="icon"
              width={40}
              height={40}
            />
          </div>
          <div
            className={styles.headerBottom}
            style={{ background: lighten(modalTpl.color_bg ?? '#f9fafb') }}
          >
            <p className={styles.promo}>{modalTpl.promo_text}</p>
          </div>
        </div>

        {/* === Right Pane === */}
        <div
          className={styles.rightPane}
          style={{ background: modalTpl.color_bg ?? undefined }}
        >
          <div className={styles.modalStampsGrid}>
            {Array.from({ length: modalTpl.stamp_total }).map((_, i) => {
              const pos = i + 1;
              const hasReward = modalTpl.rewards_map.some(r => r.stamp_no === pos);
              return (
                <div key={pos} className={styles.modalStampCircle}>
                  {hasReward ? (
                    <Gift size={32} />
                  ) : (
                    <Image
                      src={`${baseUrl}${modalTpl.stamp_icon_url ?? ''}`}
                      alt="stamp"
                      fill
                      className={styles.desat}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className={styles.ownerSection}>
            <span>Este cartão pertence a:</span>
            <div className={styles.ownerSignatureWrapper}>
              <div
                className={`
                  ${styles.ownerName}
                  ${
                    (showNameFor === modalTpl.id || limitExceededMap[modalTpl.id])
                      ? styles.writeAnim
                      : ''
                  }
                `}
              >
                {(showNameFor === modalTpl.id || limitExceededMap[modalTpl.id]) && user?.name}
              </div>
              <div className={styles.signatureLine} />
            </div>
          </div>

          {modalTpl.rules.length > 0 && (
            <div className={styles.rulesContainer}>
              {modalTpl.rules.map(rule => (
                <p key={rule.id} className={styles.ruleText}>
                  {getConfigText(rule)}
                </p>
              ))}
            </div>
          )}

          <div className={styles.expiry}>
            Expira{' '}
            {modalTpl.emission_end
              ? new Date(modalTpl.emission_end).toLocaleDateString('pt-BR')
              : '—'}
          </div>
        </div>
      </div>

      {/* === Botão de Obter Cartão === */}
      <Button
        onClick={() => handleClaim(modalTpl.id)}
        disabled={claimedMap[modalTpl.id] || limitExceededMap[modalTpl.id]}
        bgColor={modalTpl.color_primary ?? undefined}
        style={{ marginTop: 16 }}
      >
        {limitExceededMap[modalTpl.id]
          ? 'Limite por usuário excedido'
          : claimedMap[modalTpl.id]
          ? 'Resgatado ✔'
          : claimingId === modalTpl.id
          ? 'Resgatando…'
          : 'Obter cartão'}
      </Button>

      {/* === Nova seção: Lista de Presentes === */}
      <div className={styles.rewardsList}>
        {modalTpl.rewards_map.map(link => (
          <div key={link.id} className={styles.rewardCard}>
            <Image
              src={`${baseUrl}${link.reward.image_url ?? ''}`}
              alt={link.reward.name}
              width={80}
              height={80}
              className={styles.rewardImage}
            />
            <div className={styles.rewardInfo}>
              <h5 className={styles.rewardName}>{link.reward.name}</h5>
              {link.reward.description && (
                <p className={styles.rewardDescription}>
                  {link.reward.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )}
</Modal>


    </div>
  );
}
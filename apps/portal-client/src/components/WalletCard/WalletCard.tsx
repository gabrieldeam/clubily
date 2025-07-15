// src/components/WalletCard/WalletCard.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Gift, Check, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import QRCode from 'react-qr-code';
import { generateStampCode, generateRewardCode } from '@/services/loyaltyService';   
import type { InstanceDetail, RuleRead, CodeResponse, RewardCodeResponse, RewardRedemptionRead } from '@/types/loyalty';
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
  const { user } = useAuth();
  const tpl = card.template;
  const primary = tpl.color_primary ?? '#4f46e5';
  const bg = tpl.color_bg ?? '#f9fafb';
  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';
  const [claimedRewards, setClaimedRewards] = useState<Record<string, boolean>>({});
  const [loadingReward, setLoadingReward] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [rewardCode, setRewardCode] = useState<RewardCodeResponse | null>(null);

  const isCompleted = card.completed_at !== null;

  const total = tpl.stamp_total;
  const given = new Set(card.stamps.map(s => s.stamp_no));

  const [selectedRewardStamp, setSelectedRewardStamp] = useState<number | null>(null);

  const [stampCode, setStampCode] = useState<CodeResponse | null>(null);
  const [loadingStamp, setLoadingStamp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const codeInfo = stampCode ?? rewardCode;

  const [redemptions, setRedemptions] = useState<RewardRedemptionRead[]>(card.redemptions);


  async function handleGenerateStamp() {
    try {
      setError(null);
      setLoadingStamp(true);
      const res = await generateStampCode(card.id);
      setStampCode(res.data);
    } catch (err) {
      console.error(err);
      setError('Falha ao gerar código de carimbo.');
    } finally {
      setLoadingStamp(false);
    }
  }

  async function handleClaimReward(linkId: string) {
    setClaimError(null);
    setLoadingReward(true);
    try {
      const res = await generateRewardCode(card.id, linkId);
      setRewardCode(res.data);
      // atualiza redemptions com used=true
      setRedemptions(prev => [
        ...prev,
        {
          link_id: linkId,
          instance_id: card.id,
          used: true,
          code: res.data.code,
          expires_at: res.data.expires_at
        }
      ]);
      setSelectedRewardStamp(null);
    } catch (err) {
      console.error(err);
      setClaimError('Falha ao gerar código de recompensa.');
    } finally {
      setLoadingReward(false);
    }
  }




  return (
    <div className={styles.cardContainer}>

      {/* ===== NOVA SEÇÃO: INFORMAÇÕES DA EMPRESA ===== */}
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

      {/* === Card principal (header + círculos) === */}
      <div
        className={styles.cardMain}
        style={{
          borderLeftColor: primary,
          background: `linear-gradient(to right, ${lighten(bg)} 0%, ${bg} 30%)`,
        }}
      >
        
        {/* resultado da geração de código */}
          {codeInfo ? (
            <div className={styles.stampCode}>
              {/* Botão de fechar */}
              <button
                className={styles.closeButton}
                onClick={() => {
                  setStampCode(null);
                  setRewardCode(null);
                }}
                aria-label="Fechar código"
              >
                <X size={20} />
              </button>

              {/* QR Code */}
              <QRCode
                value={codeInfo.code}
                size={128}
                bgColor="transparent"
              />

              {/* Código embaixo */}
              <p className={styles.codeText}>{codeInfo.code}</p>

              {/* Expiração formatada */}
              <p className={styles.expiration}>
                Expira em{' '}
                {new Date(codeInfo.expires_at)
                  .toLocaleDateString('pt-BR', { dateStyle: 'long' })}
                {' '}às{' '}
                {new Date(codeInfo.expires_at)
                  .toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
              </p>
            </div>  
        ) : (
          <div
            className={styles.card}
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
                  {Array.from({ length: total }).map((_, idx) => {
                    const pos = idx + 1;                                          // posição real do carimbo
                    const hasReward = tpl.rewards_map.some(r => r.stamp_no === pos);
                    const earned = given.has(pos);                                // se já deu carimbo
                    return (
                      <div
                        key={pos}
                        className={styles.stampCircle}
                        style={{
                          cursor: hasReward ? 'pointer' : 'default',
                          // só coloca a borda quando earned for true
                          border: earned ? `2px solid ${primary}` : undefined,
                        }}
                        onClick={() => {
                          if (!hasReward) return;
                          setSelectedRewardStamp(prev => (prev === pos ? null : pos));
                        }}
                      >
                        {earned
                          ? <Image
                              src={`${baseUrl}${tpl.stamp_icon_url ?? ''}`}
                              alt="stamp"
                              fill
                            />
                              // carimbo dado
                          : hasReward
                            ? <Gift size={24} />                                  // laço de recompensa
                            : (
                              <Image
                                src={`${baseUrl}${tpl.stamp_icon_url ?? ''}`}
                                alt="stamp"
                                fill
                                className={styles.desat}
                              />
                            )
                        }
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
      )}

        <div className={styles.actions}>  
            <button
              onClick={handleGenerateStamp}
              disabled={loadingStamp}
              className={styles.actionButton}
            >
              {loadingStamp ? 'Gerando código…' : 'Gerar código de carimbo'}
            </button>
          </div>         

          {/* exibe erro, se houver */}
          {error && <p className={styles.errorText}>{error}</p>}





      </div>

      {/* === Footer de expiração e botão de resgate (fora do cardMain) === */}
      <div className={styles.cardFooter}>
       <div>
         <span>Emitido em: {new Date(card.issued_at).toLocaleDateString('pt-BR')}</span>
          {tpl.emission_end && (
            <span> | Expira em: {new Date(tpl.emission_end).toLocaleDateString('pt-BR')}</span>
          )}
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

      {/* === Recompensas disponíveis (fora do cardMain) === */}
{tpl.rewards_map.length > 0 && (
  <div className={styles.rewardsSection}>
    <h4 className={styles.rewardsTitle}>Prêmios</h4>
    <div className={styles.rewardsGrid}>
      {tpl.rewards_map.map(link => {
        const ready = card.stamps_given >= link.stamp_no;
        const isClaimed = redemptions.some(r => r.link_id === link.id && r.used);
        const isBlinking = link.stamp_no === selectedRewardStamp;

        return (
          <div
            key={link.id}
            className={`${styles.rewardItem} ${isBlinking ? styles.blink : ''}`}
          >
            <div className={styles.rewardIcon}>
              {link.reward.image_url
                ? <Image
                    src={`${baseUrl}${link.reward.image_url}`}
                    alt={link.reward.name}
                    width={48}
                    height={48}
                  />
                : <Gift size={24} />}
            </div>
            <div className={styles.rewardInfo}>
              <h5>{link.reward.name}</h5>
              <p>No carimbo {link.stamp_no}</p>
            </div>
            <div className={styles.rewardStatus}>
              {isClaimed
                ? <span className={styles.claimed}>Resgatado</span>
                : ready
                  ? <button
                      className={styles.claimSmallButton}
                      onClick={() => handleClaimReward(link.id)}
                      disabled={loadingReward}
                    >
                      {loadingReward ? 'Resgatando…' : 'Resgatar'}
                    </button>
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

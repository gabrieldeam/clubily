// src/app/link/[slug]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Confetti from 'react-confetti';
import Image from 'next/image';
import Modal from '@/components/Modal/Modal';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import Loading from '@/components/Loading/Loading';
import { fetchDigitalRule, triggerDigitalRule } from '@/services/digitalBehaviorService';
import type { DigitalBehaviorResponse } from '@/types/digitalBehavior';
import styles from './page.module.css';

function formatDate(dateString?: string): string {
  if (!dateString) return '–';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export default function DigitalRulePage() {
  const params = useParams();
  const rawSlug = params.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug ?? '';
  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';

  const [rule, setRule] = useState<DigitalBehaviorResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [method, setMethod] = useState<'cpf' | 'phone' | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [triggerError, setTriggerError] = useState<string | null>(null);
  const [awardedPoints, setAwardedPoints] = useState<number | null>(null);

  // controla tamanho da janela para o Confetti
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!slug) {
      setError('Slug inválido.');
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchDigitalRule(slug)
      .then(data => setRule(data))
      .catch(() => setError('Não foi possível carregar a regra.'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className={styles.page}>
        <Loading />
      </div>
    );
  }
  if (error) {
    return <div className={styles.page}>{error}</div>;
  }
  if (!rule) {
    return <div className={styles.page}>Regra não encontrada.</div>;
  }

  // tela de sucesso
  if (awardedPoints !== null) {
    return (
      <div className={styles.page}>
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={240}
          recycle={false}
        />
        <div className={styles.successCard}>
          <p className={styles.successEmoji}>🎉</p>
          <p className={styles.successTitle}>Parabéns!</p>
          <p className={styles.successText}>Você ganhou <b>{awardedPoints}</b> pontos.</p>
        </div>
      </div>
    );
  }

  const today = new Date();
  const startDate = rule.valid_from ? new Date(rule.valid_from) : null;
  const showStartDate = startDate ? startDate > today : false;
  const plural = rule.max_attributions === 1 ? 'vez' : 'vezes';

  const openModal = () => {
    setShowModal(true);
    setMethod(null);
    setInputValue('');
    setTriggerError(null);
  };
  const closeModal = () => {
    setShowModal(false);
    setMethod(null);
    setInputValue('');
    setTriggerError(null);
  };
  const handleModalSubmit = async () => {
    if (!inputValue) {
      setTriggerError(`Informe o ${method === 'cpf' ? 'CPF' : 'Telefone'}.`);
      return;
    }
    setTriggerError(null);
    setTriggerLoading(true);
    try {
      const payload = method === 'cpf' ? { cpf: inputValue } : { phone: inputValue };
      const points = await triggerDigitalRule(slug, payload);
      setAwardedPoints(points);
      closeModal();
    } catch {
      setTriggerError('Erro ao tentar ganhar pontos.');
    } finally {
      setTriggerLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>{rule.name}</h1>

          <div className={styles.logoSection}>
            {rule.company.logo_url && (
              <div className={styles.logoCircle}>
                <Image
                  src={`${baseUrl}${rule.company.logo_url}`}
                  alt={`${rule.company.name} logo`}
                  width={80}
                  height={80}
                  className={styles.logoImg}
                  style={{ objectFit: 'cover' }}
                />
              </div>
            )}
            <span className={styles.multiplier}>×</span>
            <Image
              src="/logoClubily.svg"
              alt="Logo Clubily"
              width={80}
              height={80}
              className={styles.clubilyLogo}
            />
          </div>
        </div>

        <div className={styles.badges}>
          <span className={`${styles.badge} ${styles.badgePrimary}`}>
            +{rule.points} pontos
          </span>
          <span className={styles.badge}>
            Máx. {rule.max_attributions} {plural}
          </span>
          <span className={styles.badge}>
            Até {formatDate(rule.valid_to)}
          </span>
        </div>

        {rule.description && (
          <p className={styles.description}>{rule.description}</p>
        )}

        {showStartDate && (
          <p className={styles.ruleInfo}>
            A distribuição começa em {formatDate(rule.valid_from)}.
          </p>
        )}

        <div className={styles.ctaRow}>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={openModal}>
            Quero os pontos
          </button>
        </div>

        <div className={styles.companySection}>
          <h2 className={styles.subtitle}>Dados da empresa</h2>
          <ul className={styles.companyList}>
            <li><span>Nome</span><span>{rule.company.name}</span></li>
            <li><span>Telefone</span><span>{rule.company.phone}</span></li>
            {rule.company.cnpj && (
              <li><span>CNPJ</span><span>{rule.company.cnpj}</span></li>
            )}
          </ul>
        </div>
      </div>

      <Modal open={showModal} onClose={closeModal} width={420}>
        {!method ? (
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Como você quer se identificar?</h3>
            <div className={styles.methodButtons}>
              <button onClick={() => setMethod('phone')} className={`${styles.btn} ${styles.btnSecondary} ${styles.btnBlock}`}>
                Telefone
              </button>
              <button onClick={() => setMethod('cpf')} className={`${styles.btn} ${styles.btnPrimary} ${styles.btnBlock}`}>
                CPF
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>
              Informe seu {method === 'cpf' ? 'CPF' : 'Telefone'}
            </h3>
            <div className={styles.inputWrap}>
              <FloatingLabelInput
                id={method}
                label={method === 'cpf' ? 'CPF' : 'Telefone'}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                disabled={triggerLoading}
              />
            </div>

            {triggerError && <p className={styles.error}>{triggerError}</p>}

            <div className={styles.modalActions}>
              <button onClick={closeModal} className={`${styles.btn} ${styles.btnGhost}`}>
                Cancelar
              </button>
              <button
                onClick={handleModalSubmit}
                disabled={triggerLoading}
                className={`${styles.btn} ${styles.btnPrimary}`}
              >
                {triggerLoading ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

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

  // 1) monitorar tamanho da janela
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

  // loading inicial
  if (loading) {
    return (
      <div className={styles.container}>
        <Loading />
      </div>
    );
  }
  if (error) {
    return <div className={styles.container}>{error}</div>;
  }
  if (!rule) {
    return <div className={styles.container}>Regra não encontrada.</div>;
  }

  // se já ganhou pontos, renderiza só sucesso com confetti full-screen
  if (awardedPoints !== null) {
    return (
      <div className={styles.container}>
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={200}
          recycle={false}
        />
        <div className={styles.success}>
          <p>🎉 Parabéns! Você ganhou {awardedPoints} pontos! 🎉</p>
        </div>
      </div>
    );
  }

  // resto do conteúdo
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
    <div className={styles.container}>
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

      <p className={styles.ruleInfo}>
        Ganhe {rule.points} pontos, no máximo {rule.max_attributions} {plural}, até {formatDate(rule.valid_to)}.
      </p>

      <button className={styles.primaryButton} onClick={openModal}>
        Quero os pontos
      </button>

      {rule.description && (
        <p className={styles.description}>
          {rule.description}
        </p>
      )}

      {showStartDate && (
        <p className={styles.ruleInfo}>
          A distribuição começa dia {formatDate(rule.valid_from)}.
        </p>
      )}

      <div className={styles.companySection}>
        <h2 className={styles.subtitle}>Dados da empresa</h2>
        <ul className={styles.companyList}>
          <li><span>Nome:</span><span>{rule.company.name}</span></li>
          <li><span>E-mail:</span><span>{rule.company.email}</span></li>
          <li><span>Telefone:</span><span>{rule.company.phone}</span></li>
          {rule.company.cnpj && (
            <li><span>CNPJ:</span><span>{rule.company.cnpj}</span></li>
          )}
        </ul>
      </div>

      <Modal open={showModal} onClose={closeModal} width={360}>
        {!method ? (
          <div className={styles.methodButtons}>
            <button onClick={() => setMethod('phone')} className={styles.modalButton}>
              Telefone
            </button>
            <button onClick={() => setMethod('cpf')} className={styles.modalButton}>
              CPF
            </button>
          </div>
        ) : (
          <div className={styles.modalContent}>
            <FloatingLabelInput
              id={method}
              label={method === 'cpf' ? 'CPF' : 'Telefone'}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              disabled={triggerLoading}
            />
            {triggerError && <p className={styles.error}>{triggerError}</p>}
            <div className={styles.modalActions}>
              <button onClick={closeModal} className={styles.modalButton}>
                Cancelar
              </button>
              <button
                onClick={handleModalSubmit}
                disabled={triggerLoading}
                className={styles.modalButton}
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

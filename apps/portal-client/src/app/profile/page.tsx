// src/app/link/[slug]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { fetchDigitalRule } from '@/services/digitalBehaviorService';
import type { DigitalBehaviorResponse } from '@/types/digitalBehavior';
import styles from './page.module.css';

export default function DigitalRulePage() {
  const params = useParams();
  const rawSlug = params.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug ?? '';

  // Base URL para imagens
  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';

  const [rule, setRule] = useState<DigitalBehaviorResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError('Slug inválido.');
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchDigitalRule(slug)
      .then(data => setRule(data))
      .catch(err => {
        console.error(err);
        setError('Não foi possível carregar a regra.');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className={styles.container}>Carregando...</div>;
  if (error)   return <div className={styles.container}>{error}</div>;
  if (!rule)   return <div className={styles.container}>Regra não encontrada.</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{rule.name}</h1>
      {rule.description && <p className={styles.description}>{rule.description}</p>}

      <ul className={styles.list}>
        <li className={styles.item}>
          <span className={styles.label}>Slug:</span>
          <span className={styles.value}>{rule.slug}</span>
        </li>
        <li className={styles.item}>
          <span className={styles.label}>Pontos:</span>
          <span className={styles.value}>{rule.points}</span>
        </li>
        <li className={styles.item}>
          <span className={styles.label}>Validade:</span>
          <span className={styles.value}>
            {rule.valid_from ?? '–'} até {rule.valid_to ?? '–'}
          </span>
        </li>
        <li className={styles.item}>
          <span className={styles.label}>Máx. atribuições:</span>
          <span className={styles.value}>{rule.max_attributions}</span>
        </li>

        {/* Dados da empresa */}
        <li className={styles.item}>
          <span className={styles.label}>Empresa:</span>
          <span className={styles.value}>{rule.company.name}</span>
        </li>
        <li className={styles.item}>
          <span className={styles.label}>E-mail:</span>
          <span className={styles.value}>{rule.company.email}</span>
        </li>
        <li className={styles.item}>
          <span className={styles.label}>Telefone:</span>
          <span className={styles.value}>{rule.company.phone}</span>
        </li>
        {rule.company.cnpj && (
          <li className={styles.item}>
            <span className={styles.label}>CNPJ:</span>
            <span className={styles.value}>{rule.company.cnpj}</span>
          </li>
        )}
        {rule.company.logo_url && (
          <li className={styles.item}>
            <span className={styles.label}>Logo:</span>
            <img
              src={`${baseUrl}${rule.company.logo_url}`}
              alt={`${rule.company.name} logo`}
              className={styles.logo}
            />
          </li>
        )}
      </ul>
    </div>
  );
}

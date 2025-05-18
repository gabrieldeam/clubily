// src/app/companies/[id]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { getCompanyInfo } from '@/services/companyService';
import type { CompanyRead } from '@/types/company';
import Header from '@/components/Header/Header';
import styles from './page.module.css';

export default function CompanyPage() {
  // 1️⃣ Hooks sempre no topo, na mesma ordem
  const { loading: authLoading } = useRequireAuth();
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [company, setCompany] = useState<CompanyRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';

  // 2️⃣ Fetch dos dados
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    getCompanyInfo(id)
      .then(res => setCompany(res.data))
      .catch(err => {
        console.error(err);
        setError('Não foi possível carregar os dados da empresa.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  // 3️⃣ Early returns após todos os hooks
  if (authLoading) {
    // ainda verificando sessão
    return null;
  }
  if (loading) {
    return (
      <section className={styles.container}>
        <Header />
        <p className={styles.message}>Carregando dados da empresa…</p>
      </section>
    );
  }
  if (error) {
    return (
      <section className={styles.container}>
        <Header />
        <p className={styles.error}>{error}</p>
        <button onClick={() => router.back()} className={styles.backBtn}>
          ← Voltar
        </button>
      </section>
    );
  }
  if (!company) {
    return (
      <section className={styles.container}>
        <Header />
        <p className={styles.message}>Empresa não encontrada.</p>
        <button onClick={() => router.back()} className={styles.backBtn}>
          ← Voltar
        </button>
      </section>
    );
  }

  // 4️⃣ Render principal
  return (
    <div className={styles.container}>
      <Header />

      <button onClick={() => router.back()} className={styles.backBtn}>
        ← Voltar
      </button>

      <div className={styles.detail}>
        {company.logo_url && (
          <Image
            src={`${baseUrl}${company.logo_url}`}
            alt={company.name}
            width={120}
            height={120}
            className={styles.logo}
          />
        )}

        <h1 className={styles.name}>{company.name}</h1>
        {company.description && (
          <p className={styles.description}>{company.description}</p>
        )}

        <div className={styles.infoGrid}>
          <div>
            <strong>Endereço</strong>
            <p>
              {company.street}, {company.city} – {company.state},{' '}
              {company.postal_code}
            </p>
          </div>
          <div>
            <strong>Contato</strong>
            <p>{company.phone}</p>
            <p>{company.email}</p>
          </div>
          <div>
            <strong>Status</strong>
            <p>{company.is_active ? 'Ativa' : 'Desativada'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

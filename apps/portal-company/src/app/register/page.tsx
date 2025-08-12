'use client';

import Image from 'next/image';
import { Suspense, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import RegisterForm from '@/components/RegisterForm/RegisterForm';
import styles from './page.module.css';

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className={styles.container}>Carregando...</div>}>
      <RegisterPageContent />
    </Suspense>
  );
}

function RegisterPageContent() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code') ?? undefined;

  useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [loading, user, router]);

  if (loading) {
    return <div className={styles.container}>Carregando...</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Image src="/logo.svg" alt="Logo" width={150} height={40} priority />
      </header>

      <main className={styles.main}>
        <div className={styles.leftPanel}>
          <div className={styles.content}>
            <RegisterForm
              initialReferralCode={code}
              onSuccess={async () => {
                await refreshUser();
                router.replace('/?welcome=true');
              }}
            />
          </div>

          <div className={styles.footer}>
            <a href="/termos-de-uso" target="_blank" rel="noopener noreferrer">
              Termos de Uso
            </a>
            <span className={styles.separator}>|</span>
            <a href="/politica-de-privacidade" target="_blank" rel="noopener noreferrer">
              Política de Privacidade
            </a>
          </div>
        </div>

        <div className={styles.rightPanel}>
          <Image src="/moedagb.svg" alt="Moeda GB" width={450} height={450} priority />
        </div>
      </main>
    </div>
  );
}

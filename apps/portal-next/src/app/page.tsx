// src/app/page.tsx
'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import LoginForm from '@/components/LoginForm/LoginForm';
import RegisterForm from '@/components/RegisterForm/RegisterForm';
import Dashboard from '@/components/Dashboard/Dashboard';
import { getCurrentCompany } from '@/services/companyService';
import styles from './page.module.css';

export default function Home() {
  const [view, setView] = useState<'login' | 'register'>('login');
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentCompany()
      .then(() => setLoggedIn(true))
      .catch(() => setLoggedIn(false))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className={styles.container}>Carregando...</div>;
  }

  if (loggedIn) {
    return <Dashboard />;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Image
          src="/logo.svg"
          alt="Logo"
          width={150}
          height={40}
          priority
        />
      </header>

      <main className={styles.main}>
        <div className={styles.leftPanel}>
          {view === 'login' ? (
            <>
              <LoginForm onSuccess={() => setLoggedIn(true)} />
              <div className={styles.toggleText}>
                Não tem uma conta?
                <span
                  className={styles.toggleLink}
                  onClick={() => setView('register')}
                >
                  Cadastrar
                </span>
              </div>
            </>
          ) : (
            <>
              <RegisterForm onSuccess={() => setLoggedIn(true)} />
              <div className={styles.toggleText}>
                Já tem uma conta?
                <span
                  className={styles.toggleLink}
                  onClick={() => setView('login')}
                >
                  Entrar
                </span>
              </div>
            </>
          )}
        </div>
        <div className={styles.rightPanel} />
      </main>
    </div>
  );
}

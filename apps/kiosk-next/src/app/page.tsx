'use client';

import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import LoginForm from '@/components/LoginForm/LoginForm';
import Dashboard from '@/components/Dashboard/page';
import styles from './page.module.css';

export default function Home() {
  const [view, setView] = useState<'login' | 'register'>('login');
  const { user, loading, refreshUser } = useAuth();

  if (loading) {
    return <div className={styles.container}>Carregando...</div>;
  }

  if (user) {
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
          <div className={styles.content}>
                <LoginForm onSuccess={refreshUser}  />                
          </div>
          {/* <div className={styles.footer}>
            <a href="/termos-de-uso" target="_blank" rel="noopener">
              Termos de Uso
            </a>
            <span className={styles.separator}>|</span>
            <a href="/politica-de-privacidade" target="_blank" rel="noopener">
              Política de Privacidade
            </a>
          </div> */}
        </div>        
      </main>
    </div>
  );
}

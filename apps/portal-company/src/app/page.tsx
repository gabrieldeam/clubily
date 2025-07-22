'use client';

import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/LoginForm/LoginForm';
import RegisterForm from '@/components/RegisterForm/RegisterForm';
import Dashboard from '@/components/Dashboard/Dashboard';
import styles from './page.module.css';

export default function Home() {
  const [view, setView] = useState<'login' | 'register'>('login');
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();

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
            {view === 'login' ? (
              <>
                <LoginForm onSuccess={refreshUser}  />
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
                <RegisterForm 
                   onSuccess={async () => {
                   await refreshUser();
                   router.replace('/?welcome=true');
                 }}  
                />
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

          <div className={styles.footer}>
            <a href="/termos-de-uso" target="_blank" rel="noopener">
              Termos de Uso
            </a>
            <span className={styles.separator}>|</span>
            <a href="/politica-de-privacidade" target="_blank" rel="noopener">
              Política de Privacidade
            </a>
          </div>
        </div>
        <div className={styles.rightPanel}>
          <Image
            src="/moedagb.svg"
            alt="Moeda GB"
            width={450}   
            height={450}
            priority
          />
        </div>
      </main>
    </div>
  );
}

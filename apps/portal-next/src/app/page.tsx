'use client';

import { useEffect, useState } from 'react';
import LoginForm from '@/components/LoginForm/LoginForm';
import RegisterForm from '@/components/RegisterForm/RegisterForm';
import Dashboard from '@/components/Dashboard/Dashboard';
import { getCurrentCompany } from '@/services/companyService';
import styles from './page.module.css';

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Ao montar, checa se o cookie de sessão é válido
  useEffect(() => {
    getCurrentCompany()
      .then(() => setLoggedIn(true))
      .catch(() => setLoggedIn(false))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className={styles.page}>Carregando...</div>;
  }

  return (
    <div className={styles.page}>
      {!loggedIn ? (
        <div className={styles.authContainer}>
          <LoginForm onSuccess={() => setLoggedIn(true)} />
          <RegisterForm />
        </div>
      ) : (
        <Dashboard />
      )}
    </div>
  );
}

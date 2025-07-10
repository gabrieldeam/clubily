'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from './VerifyEmailCompany.module.css';
import Button from '@/components/Button/Button';
import { verifyEmailCompany } from '@/services/companyService';

export default function VerifyEmailCompanyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token ausente.');
      return;
    }

    verifyEmailCompany(token!)
      .then(res => {
        setStatus('success');
        setMessage(res.data.msg || 'E-mail verificado com sucesso!');
      })
      .catch(err => {
        const detail =
          err.response?.data?.detail || 'Não foi possível verificar o e-mail.';
        setStatus('error');
        setMessage(detail);
      });
  }, [token]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {status === 'loading' && (
          <>
            <div className={styles.spinner} />
            <p className={styles.msg}>Verificando seu e-mail...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <h2 className={styles.title}>Tudo certo!</h2>
            <p className={styles.msg}>{message}</p>
            <Button
              onClick={() => router.push('/')}
              style={{ marginTop: '24px' }}
            >
              Acessar painel
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <h2 className={styles.titleError}>Ops!</h2>
            <p className={styles.msg}>{message}</p>
            <Button
              onClick={() => router.push('/')}
              style={{ marginTop: '24px', backgroundColor: '#777' }}
            >
              Voltar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

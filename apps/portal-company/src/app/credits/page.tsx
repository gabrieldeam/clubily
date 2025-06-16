// src/app/credits/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header/Header';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import Button from '@/components/Button/Button';
import Notification from '@/components/Notification/Notification';
import { buyCredits, getCharge } from '@/services/companyPaymentService';
import type { CompanyPaymentRead } from '@/types/companyPayment';
import styles from './page.module.css';

export default function CreditsPage() {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [payment, setPayment] = useState<CompanyPaymentRead | null>(null);
  const [status, setStatus] = useState<CompanyPaymentRead['status'] | null>(null);

  const [countdown, setCountdown] = useState(0);
  // → aqui: tipamos como number | null
  const intervalRef = useRef<number | null>(null);

  // dispara a compra
  const handleBuy = async () => {
    setError(null);
    const val = parseFloat(amount.replace(',', '.'));
    if (isNaN(val) || val < 25) {
      setError('Informe um valor numérico ≥ R$ 25,00');
      return;
    }
    try {
      const res = await buyCredits({ amount: val });
      setPayment(res.data);
      setStatus(res.data.status);
      setCountdown(30);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao gerar cobrança.');
    }
  };

  // polling a cada segundo
  useEffect(() => {
    // se não há cobrança ou já finalizou, limpa intervalo e sai
    if (!payment || ['PAID','FAILED','CANCELLED'].includes(status!)) {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // inicia intervalo se ainda não existe
    if (intervalRef.current === null) {
      intervalRef.current = window.setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            // busca novo status
            getCharge(payment.id)
              .then(upd => setStatus(upd.data.status))
              .catch(() => {});
            return 30;
          }
          return c - 1;
        });
      }, 1000);
    }

    // limpa intervalo ao desmontar/com payment change
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [payment, status]);

  return (
    <div className={styles.page}>
      <Header onSearch={() => {}} />
      <main className={styles.main}>
        {!payment ? (
          <section className={styles.buySection}>
            {/* ... formulário de compra ... */}
          </section>
        ) : (
          <section className={styles.statusSection}>
            {/* ... exibição do PIX, status e contador ... */}
            <div className={styles.countdown}>
              Próxima verificação em <strong>{countdown}s</strong>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

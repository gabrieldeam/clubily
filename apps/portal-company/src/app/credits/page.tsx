// src/app/credits/page.tsx
'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { isAxiosError } from 'axios';
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
  const intervalRef = useRef<number | null>(null);
  const [copied, setCopied] = useState(false);

  const handleBuy = async (e: FormEvent) => {
    e.preventDefault();
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
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.detail || 'Erro ao gerar cobrança.');
      } else {
        setError('Erro ao gerar cobrança.');
      }
    }
  };

  useEffect(() => {
    if (!payment || ['PAID', 'FAILED', 'CANCELLED'].includes(status!)) {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    if (intervalRef.current === null) {
      intervalRef.current = window.setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            getCharge(payment.id)
              .then(upd => setStatus(upd.data.status))
              .catch(() => {});
            return 30;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [payment, status]);

  const qrSrc = payment?.pix_qr_code
    ? payment.pix_qr_code.startsWith('data:')
      ? payment.pix_qr_code
      : `data:image/png;base64,${payment.pix_qr_code}`
    : '';

  // Define a chave de estilo, vazia se status for null
  const statusClass = status ? styles[status.toLowerCase()] : '';

  return (
    <>
      <Header />
      <div className={styles.page}>
        <main className={styles.main}>
          <div className={styles.card}>
            {!payment ? (
              <form className={styles.form} onSubmit={handleBuy}>
                <h2 className={styles.title}>Comprar Créditos</h2>
                <p className={styles.subtext}>Valor mínimo R$ 25,00</p>
                {error && (
                  <Notification type="error" message={error} onClose={() => setError(null)} />
                )}
                <div className={styles.formGroup}>
                  <FloatingLabelInput
                    id="credit-amount"
                    name="amount"
                    label="Informe o valor (R$)"
                    type="text"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                  />
                </div>
                <Button type="submit">
                  Gerar Cobrança
                </Button>
              </form>
            ) : status === 'PAID' ? (
              <div className={styles.success}>
                <span className={styles.checkIcon}>✅</span>
                <h2 className={styles.title}>Pagamento Confirmado!</h2>
                <p>Seus créditos foram atualizados com sucesso.</p>
                <Link href="/wallet" className={styles.goWalletBtn}>
                  Ir para Minha Carteira
                </Link>
              </div>
            ) : (
              <div className={styles.status}>
                <h2 className={styles.title}>Status da Cobrança</h2>
                <div>
                  <div className={styles.infoGrid}>
                    <div><strong>Valor</strong></div>
                    <div>R$ {payment.amount.toFixed(2)}</div>
                  </div>
                  <div className={styles.infoGrid}>
                    <div><strong>Status</strong></div>
                    <div className={statusClass}>Pedente</div>
                  </div>                 
                </div>
                {qrSrc && (
                  <div className={styles.qrContainer}>
                    <Image
                      src={qrSrc}
                      alt="PIX QR Code"
                      width={200}
                      height={200}
                      priority
                    />
                  </div>
                )}
                <div className={styles.copyContainer}>
                  <label htmlFor="pix-code">Código Pix</label>
                  <div className={styles.copyRow}>
                    <input
                      id="pix-code"
                      readOnly
                      value={payment.pix_copy_paste_code}
                      className={styles.copyInput}
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(payment.pix_copy_paste_code);
                        setCopied(true);
                        // volta ao texto original após 3s
                        setTimeout(() => setCopied(false), 3000);
                      }}
                      className={styles.copyBtn}
                    >
                      {copied ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                </div>
                <p className={styles.meta}>
                  Expira em: <strong>{new Date(payment.pix_expires_at).toLocaleString()}</strong>
                </p>
                <p className={styles.meta}>
                  Próxima verificação em <strong>{countdown}s</strong>
                </p>
                {status === 'FAILED' && (
                  <Notification
                    type="error"
                    message="O pagamento não foi confirmado. Tente novamente."
                    onClose={() => {}}
                  />
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

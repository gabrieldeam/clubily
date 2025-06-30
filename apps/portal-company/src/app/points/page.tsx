// src/app/points/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Header from '@/components/Header/Header';
import Notification from '@/components/Notification/Notification';
import Button from '@/components/Button/Button';
import { purchasePoints, getPointPurchase } from '@/services/pointPurchaseService';
import { listPointPlans } from '@/services/pointPlanService';
import type { PointPlanRead } from '@/types/pointPlan';
import type { PointPurchaseRead } from '@/types/pointPurchase';
import styles from './page.module.css';

export default function PointsPage() {
  const [plans, setPlans] = useState<PointPlanRead[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [planError, setPlanError] = useState<string | null>(null);

  const [purchase, setPurchase] = useState<PointPurchaseRead | null>(null);
  const [status, setStatus] = useState<PointPurchaseRead['status'] | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  // load plans
  useEffect(() => {
    listPointPlans(0, 100)
      .then(res => setPlans(res.data.items))
      .catch(() => setPlanError('Não foi possível carregar os planos.'))
      .finally(() => setLoadingPlans(false));
  }, []);

  // start purchase for a given plan
  const handlePurchasePlan = async (planId: string) => {
    setError(null);
    try {
      const res = await purchasePoints({ plan_id: planId });
      setPurchase(res.data);
      setStatus(res.data.status);
      setCountdown(30);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao iniciar a compra.');
    }
  };

  // poll status
  useEffect(() => {
    if (!purchase || ['PAID', 'FAILED', 'CANCELLED'].includes(status!)) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    if (!intervalRef.current) {
      intervalRef.current = window.setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            getPointPurchase(purchase.id)
              .then(upd => setStatus(upd.data.status))
              .catch(() => {});
            return 30;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [purchase, status]);

  const qrSrc = purchase?.pix_qr_code
    ? purchase.pix_qr_code.startsWith('data:')
      ? purchase.pix_qr_code
      : `data:image/png;base64,${purchase.pix_qr_code}`
    : '';

  return (
    <>
      <Header />
      <div className={styles.page}>
        <main className={styles.main}>

{/* ------------- PLANOS ------------- */}
          {!purchase && (
            <section className={styles.pricingBlock}>
              <h2 className={styles.pricingTitle}>Planos de Pontos</h2>
              <p className={styles.pricingSubtitle}>
                -50% em todos os planos durante a Black Friday • Garanta até 1 de Dezembro
              </p>

              {planError && (
                <Notification
                  type="error"
                  message={planError}
                  onClose={() => setPlanError(null)}
                />
              )}

              {loadingPlans ? (
                <p>Carregando planos…</p>
              ) : (
                <div className={styles.cardsGrid}>
                  {plans.map((plan, idx) => {
                    const isFeatured = idx === 1; // destaca o plano do meio
                    return (
                      <div
                        key={plan.id}
                        className={`${styles.planCard} ${isFeatured ? styles.featured : ''}`}
                      >
                        <header className={styles.cardHeader}>
                          <span className={styles.planName}>{plan.name}</span>
                          <span className={styles.planQuota}>
                            {plan.points} pontos
                          </span>
                        </header>

                        {/* dentro do map(plan => ...) */}
                        <div className={styles.priceBox}>
                        <div className={styles.price}>
                            <span className={styles.priceCurrency}>R$</span>
                            <span className={styles.priceInteger}>
                            {Math.floor(plan.price)}
                            </span>
                            <span className={styles.priceDecimal}>,
                            {plan.price.toFixed(2).split('.')[1]}
                            </span>
                        </div>
                        <span className={styles.pricePeriod}>/única</span>
                        </div>


                        {plan.description && (
                          <p className={styles.planDesc}>{plan.description}</p>
                        )}

                        {plan.subtitle && (
                          <p className={styles.planSubtitle}>{plan.subtitle}</p>
                        )}

                        {error && (
                          <Notification
                            type="error"
                            message={error}
                            onClose={() => setError(null)}
                          />
                        )}

                        <Button
                          className={styles.planButton}
                          onClick={() => handlePurchasePlan(plan.id)}
                        >
                          Quero esse
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              <p className={styles.legalNote}>
               Taxas podem variar conforme sua região.
              </p>
            </section>
          )}

          {/* STEP 2: success */}
          {purchase && status === 'PAID' && (
            <div className={styles.card}>
              <div className={styles.success}>
                <span className={styles.checkIcon}>✅</span>
                <h2 className={styles.title}>Compra Confirmada!</h2>
                <p>Você adquiriu {purchase.plan?.points ?? 0} pontos com sucesso.</p>
                <Link href="/wallet" className={styles.goWalletBtn}>
                  Ver Histórico de Compras
                </Link>
              </div>
            </div>
          )}

          {/* STEP 3: pending / failed */}
          {purchase && status !== 'PAID' && (
            <div className={styles.card}>
              <div className={styles.status}>
                <h2 className={styles.title}>Status da Compra</h2>
                <div className={styles.infoGrid}>
                  <div><strong>Plano</strong></div>
                  <div>{purchase.plan?.name}</div>
                  <div><strong>Valor</strong></div>
                  <div>R$ {purchase.amount.toFixed(2)}</div>
                  <div><strong>Status</strong></div>
                  <div className={styles[status!.toLowerCase()]}>{status}</div>
                </div>
                {qrSrc && (
                  <div className={styles.qrContainer}>
                    <img src={qrSrc} alt="PIX QR Code" className={styles.qr} />
                  </div>
                )}
                <div className={styles.copyContainer}>
                  <label htmlFor="pix-code">Código PIX</label>
                  <div className={styles.copyRow}>
                    <input
                      id="pix-code"
                      readOnly
                      value={purchase.pix_copy_paste_code ?? ''}
                      className={styles.copyInput}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        navigator.clipboard.writeText(purchase.pix_copy_paste_code ?? '')
                      }
                      className={styles.copyBtn}
                    >
                      Copiar
                    </button>
                  </div>
                </div>
                <p className={styles.meta}>
                  Expira em:{' '}
                  <strong>
                    {new Date(purchase.pix_expires_at!).toLocaleString()}
                  </strong>
                </p>
                <p className={styles.meta}>
                  Próxima verificação em <strong>{countdown}s</strong>
                </p>
                {(status === 'FAILED' || status === 'CANCELLED') && (
                  <Notification
                    type="error"
                    message="Falha na confirmação. Tente novamente."
                    onClose={() => {}}
                  />
                )}
              </div>
            </div>
          )}

        </main>
      </div>
    </>
  );
}

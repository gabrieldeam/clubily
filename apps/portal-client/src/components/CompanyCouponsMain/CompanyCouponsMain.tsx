// src/components/CompanyCouponsMain/CompanyCouponsMain.tsx
'use client';

import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { listPublicVisibleCoupons } from '@/services/couponService';
import type { CouponRead } from '@/types/coupon';
import styles from './CompanyCouponsMain.module.css';

interface Props {
  companyId: string;
  limit?: number; // opcional, padrão 12
}

function formatDiscount(c: CouponRead): string {
  if (c.discount_type === 'percent' && c.discount_value != null) {
    return `${c.discount_value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}% OFF`;
  }
  if (c.discount_type === 'fixed' && c.discount_value != null) {
    return `R$ ${c.discount_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} OFF`;
  }
  return 'Sem desconto';
}

export default function CompanyCouponsMain({ companyId, limit = 12 }: Props) {
  const [coupons, setCoupons] = useState<CouponRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    listPublicVisibleCoupons({ company_id: companyId, limit, skip: 0 }, controller.signal)
      .then((res) => setCoupons(res.items))
      .catch((err) => {
        // Ignora cancelamento (comum no StrictMode e em trocas rápidas de props)
        if (isAxiosError(err) && err.code === 'ERR_CANCELED') return;
        setError('Erro ao carregar cupons.');
        console.error('Falha ao carregar cupons:', err);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [companyId, limit]);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Cupons Disponíveis</h2>

      {loading && <p className={styles.helper}>Carregando cupons…</p>}
      {!loading && error && <p className={styles.helperError}>{error}</p>}
      {!loading && !error && coupons.length === 0 && (
        <p className={styles.helper}>Nenhum cupom no momento.</p>
      )}

      {!loading && !error && coupons.length > 0 && (
        <div className={styles.grid}>
          {coupons.map((c) => (
            <div key={c.id} className={styles.card}>
              <div className={styles.header}>
                <h3 className={styles.name}>{c.name}</h3>
                <span className={styles.badge}>{formatDiscount(c)}</span>
              </div>

              {c.description && <p className={styles.desc}>{c.description}</p>}

              <div className={styles.meta}>
                <span>
                  Código: <strong className={styles.codeMono}>{c.code}</strong>
                </span>
                {typeof c.min_order_amount === 'number' && (
                  <span>
                    Mín. pedido:{' '}
                    <strong>
                      R$ {c.min_order_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                  </span>
                )}
                {typeof c.usage_limit_per_user === 'number' && (
                  <span>
                    Máx/usuário: <strong>{c.usage_limit_per_user}</strong>
                  </span>
                )}
                {c.source_location_name && (
                  <span>
                    Local: <strong>{c.source_location_name}</strong>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

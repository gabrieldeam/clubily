// src/app/store/orders/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header/Header';
import OrderDetailModal from '@/components/OrderDetailModal/OrderDetailModal';
import { listMyRewardOrders } from '@/services/rewardsService';
import type { RewardOrderRead } from '@/types/reward';
import styles from './page.module.css';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<RewardOrderRead[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<RewardOrderRead | null>(null);

  useEffect(() => {
    setLoading(true);
    listMyRewardOrders()
      .then(res => setOrders(res.data.items))
      .finally(() => setLoading(false));
  }, []);

  const openModal = (order: RewardOrderRead) => setSelectedOrder(order);
  const closeModal = () => setSelectedOrder(null);

  // Tipo para agrupar os itens do pedido sem usar "any"
  type ItemGroup = {
    product: RewardOrderRead['items'][number]['product'];
    quantity: number;
  };

  return (
    <>
      <Header
        onSearch={q =>
          router.push(`/store/search?name=${encodeURIComponent(q)}`)
        }
      />

      <div className={styles.pageWrapper}>
        <div className={styles.container}>
          <h4 className={styles.title}>Meus Pedidos</h4>

          {loading ? (
            <p className={styles.empty}>Carregando pedidos…</p>
          ) : orders.length === 0 ? (
            <p className={styles.empty}>Você ainda não fez nenhum pedido.</p>
          ) : (
            <ul className={styles.list}>
              {orders.map(order => {
                // exibe só a parte antes do primeiro hífen
                const displayId = order.id.split('-')[0];

                // agrupa por produto
                const grouped = order.items.reduce<Record<string, ItemGroup>>(
                  (acc, cur) => {
                    const key = cur.product.id;
                    if (acc[key]) {
                      acc[key].quantity += cur.quantity;
                    } else {
                      acc[key] = { product: cur.product, quantity: cur.quantity };
                    }
                    return acc;
                  },
                  {}
                );
                const items = Object.values(grouped);

                return (
                  <li key={order.id} className={styles.itemCard}>
                    <header className={styles.cardHeader}>
                      <span className={styles.orderId}>Pedido #{displayId}</span>
                      <span className={`${styles.status} ${styles[order.status]}`}>
                        {order.status}
                      </span>
                      <span className={styles.date}>
                        {new Date(order.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </header>

                    <ul className={styles.itemsSummary}>
                      {items.map(i => (
                        <li key={i.product.id}>
                          {i.product.name} × {i.quantity}
                        </li>
                      ))}
                    </ul>

                    {order.refusal_msg && (
                      <p className={styles.refusal}>Motivo: {order.refusal_msg}</p>
                    )}

                    <button
                      className={styles.detailsBtn}
                      onClick={() => openModal(order)}
                    >
                      Ver Detalhes
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {selectedOrder && (
          <OrderDetailModal order={selectedOrder} onClose={closeModal} />
        )}
      </div>
    </>
  );
}

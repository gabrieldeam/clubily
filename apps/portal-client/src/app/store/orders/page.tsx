'use client';

import { useState, useEffect } from 'react';
import { listMyRewardOrders } from '@/services/rewardsService';
import type { PaginatedRewardOrder, RewardOrderRead } from '@/types/reward';
import OrderDetailModal from '@/components/OrderDetailModal/OrderDetailModal';
import Header from '@/components/Header/Header';
import styles from './page.module.css';

export default function OrdersPage() {
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

  return (
    <>
      <Header onSearch={q => {/* reutilize sua lógica de redirecionamento */}} />

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
                // exibe apenas até o primeiro hífen
                const displayId = order.id.split('-')[0];
                // agrupa itens por produto
                const grouped = order.items.reduce<Record<string, { product: any; quantity: number }>>((acc, cur) => {
                  if (acc[cur.product.id]) {
                    acc[cur.product.id].quantity += cur.quantity;
                  } else {
                    acc[cur.product.id] = { product: cur.product, quantity: cur.quantity };
                  }
                  return acc;
                }, {});
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
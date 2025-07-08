'use client';

import React from 'react';
import Modal from '@/components/Modal/Modal';
import type { RewardOrderRead } from '@/types/reward';
import styles from './OrderDetailModal.module.css';

interface Props {
  order: RewardOrderRead;
  onClose: () => void;
}

export default function OrderDetailModal({ order, onClose }: Props) {
  // Base URL para imagens
  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';

  // Exibe apenas o trecho do ID até o primeiro hífen
  const displayId = order.id.split('-')[0];

  // Agrupa itens por produto
  const grouped = order.items.reduce<Record<string, { product: RewardOrderRead['items'][0]['product']; quantity: number }>>((acc, cur) => {
    if (acc[cur.product.id]) {
      acc[cur.product.id].quantity += cur.quantity;
    } else {
      acc[cur.product.id] = { product: cur.product, quantity: cur.quantity };
    }
    return acc;
  }, {});

  const items = Object.values(grouped);
  const totalPoints = items.reduce((sum, i) => sum + i.product.points_cost * i.quantity, 0);

  return (
    <Modal open onClose={onClose} width={700}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h2>Pedido #{displayId}</h2>
          <span className={styles.status}>{order.status}</span>
        </header>

        <p className={styles.date}>
          Criado em: {new Date(order.created_at).toLocaleDateString('pt-BR')}
        </p>

        {order.refusal_msg && (
          <p className={styles.refusalMsg}>Motivo da recusa: {order.refusal_msg}</p>
        )}

        <section className={styles.section}>
          <h3>Endereço de Entrega</h3>
          <p>
            {order.street}, {order.number} — {order.neighborhood} <br />
            {order.city}/{order.state} — CEP {order.postal_code}<br />
            {order.complement ?? ''}
          </p>
        </section>

        <section className={styles.section}>
          <h3>Itens</h3>
          <ul className={styles.itemsList}>
            {items.map(i => (
              <li key={i.product.id} className={styles.item}>
                <img
                  src={i.product.image_url ? `${baseUrl}${i.product.image_url}` : '/placeholder.png'}
                  alt={i.product.name}
                  className={styles.thumbnail}
                />
                <div>
                  <p className={styles.name}>{i.product.name}</p>
                  <p>
                    {i.quantity} × {i.product.points_cost.toLocaleString()} pts
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <footer className={styles.footer}>
          <p>Total de pontos: <strong>{totalPoints.toLocaleString()} pts</strong></p>
        </footer>
      </div>
    </Modal>
  );
}
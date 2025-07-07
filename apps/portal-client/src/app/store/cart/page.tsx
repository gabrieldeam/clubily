'use client';

import { useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import styles from './page.module.css';
import { Trash2 } from 'lucide-react';

export default function CartPage() {
  const { items, removeItem, clearCart, totalPoints } = useCart();

  return (
    <div className={styles.container}>
      <h1>Meu Carrinho</h1>
      {items.length === 0 ? (
        <p>Seu carrinho está vazio.</p>
      ) : (
        <>
          <ul className={styles.list}>
            {items.map(item => (
              <li key={item.id} className={styles.item}>
                <img src={item.image_url ?? '/placeholder.png'} alt={item.name} />
                <div className={styles.info}>
                  <h2>{item.name}</h2>
                  <p>{item.points_cost} pts × {item.quantity}</p>
                </div>
                <button onClick={() => removeItem(item.id)} className={styles.remove}>
                  <Trash2 />
                </button>
              </li>
            ))}
          </ul>
          <div className={styles.footer}>
            <p>Total: <strong>{totalPoints} pts</strong></p>
            <button onClick={clearCart} className={styles.clear}>Limpar Carrinho</button>
            <button className={styles.checkout}>Finalizar Resgate</button>
          </div>
        </>
      )}
    </div>
  );
}

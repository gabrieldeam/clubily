'use client';

import { useEffect, useState } from 'react';
import WalletCard from '@/components/WalletCard/WalletCard';
import { listMyCards } from '@/services/loyaltyService';
import { InstanceDetail } from '@/types/loyalty';
import styles from './page.module.css';

export default function WalletPage() {
  const [cards, setCards] = useState<InstanceDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const response = await listMyCards();
        setCards(response.data);
      } catch (err) {
        setError('Falha ao carregar seus cartões');
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, []);

  if (loading) {
    return <div className={styles.loading}>Carregando seus cartões...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Meus Cartões</h1>
        <div className={styles.stats}>
          <span>{cards.length} cartões</span>
          <span>|</span>
          <span>
            {cards.filter(c => c.completed_at && !c.reward_claimed).length} prêmios disponíveis
          </span>
        </div>
      </header>

      <div className={styles.cardsContainer}>
        {cards.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🎫</div>
            <h2>Nenhum cartão encontrado</h2>
            <p>Resgate cartões fidelidade nas empresas participantes</p>
          </div>
        ) : (
          cards.map(card => <WalletCard key={card.id} card={card} />)
        )}
      </div>
    </div>
  );
}
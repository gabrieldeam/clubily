'use client';

import { useState } from 'react';
import { InstanceDetail } from '@/types/loyalty';
import SimpleCard from '@/components/SimpleCard/SimpleCard';
import styles from './OverlappingCards.module.css';

interface Props {
  cards: InstanceDetail[];
}

export default function OverlappingCards({ cards }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <div className={styles.container}>
      {cards.map((card, idx) => {
        const isActive = card.id === activeId;
        const zIndex = isActive ? cards.length + 1 : idx;
        const topOffset = isActive ? 0 : idx * 20;

        return (
          <div
            key={card.id}
            className={`${styles.cardWrapper} ${isActive ? styles.active : ''}`}
            style={{ top: topOffset, zIndex }}
            onClick={() => setActiveId(isActive ? null : card.id)}
          >
            <SimpleCard card={card} />
          </div>
        );
      })}
    </div>
  );
}

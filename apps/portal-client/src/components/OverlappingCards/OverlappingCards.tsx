// OverlappingCards.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { InstanceDetail } from '@/types/loyalty';
import SimpleCard from '@/components/SimpleCard/SimpleCard';
import styles from './OverlappingCards.module.css';

interface Props { cards: InstanceDetail[] }

export default function OverlappingCards({ cards: initial }: Props) {
  const [cards, setCards] = useState(initial);
  const [stackHeight, setStackHeight] = useState(0);

  const spacing = 110;                         // deslocamento vertical
  const cardRef = useRef<HTMLDivElement>(null); // aponta p/ o 1º cartão

  // Recalcula a altura sempre que o 1º cartão ou a qdade muda
  useEffect(() => {
    if (!cardRef.current) return;

    const update = () => {
      const h = cardRef.current!.getBoundingClientRect().height;
      setStackHeight(h + (cards.length - 1) * spacing);
    };

    // 1ª medição
    update();

    // Observa alterações de tamanho
    const ro = new ResizeObserver(update);
    ro.observe(cardRef.current);

    // Limpa ao desmontar
    return () => ro.disconnect();
  }, [cards.length]);

  // A altura reservada garante que o próximo elemento fique logo abaixo
  return (
    <div className={styles.container} style={{ height: `${stackHeight}px` }}>
      {cards.map((card, i) => {
        const top  = (cards.length - 1 - i) * spacing; // mesmo cálculo de antes
        const zIdx = cards.length - i;

        return (
          <div
            key={card.id}
            ref={i === 0 ? cardRef : undefined}        // mede só o primeiro
            className={styles.cardWrapper}
            style={{ top, zIndex: zIdx }}
            onClick={() => {
              if (i === 0) return;
              const clicked   = cards[i];
              const first     = cards[0];
              const remaining = cards.filter(c => c.id !== clicked.id && c.id !== first.id);
              setCards([clicked, ...remaining, first]);
            }}
          >
            <SimpleCard card={card} />
          </div>
        );
      })}
    </div>
  );
}

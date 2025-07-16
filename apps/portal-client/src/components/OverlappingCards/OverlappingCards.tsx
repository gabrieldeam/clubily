'use client';

import { useEffect, useRef, useState } from 'react';
import { InstanceDetail } from '@/types/loyalty';
import SimpleCard from '@/components/SimpleCard/SimpleCard';
import styles from './OverlappingCards.module.css';

interface Props {
  cards: InstanceDetail[];
}

export default function OverlappingCards({ cards: initial }: Props) {
  // Estado interno de cards, inicia com a prop 'initial'
  const [cards, setCards] = useState(initial);

  // Sincroniza o estado interno sempre que a prop 'initial' mudar
  useEffect(() => {
    setCards(initial);
  }, [initial]);

  // Altura total do stack
  const [stackHeight, setStackHeight] = useState(0);

  const spacing = 110;                         // deslocamento vertical entre cards
  const cardRef = useRef<HTMLDivElement>(null); // para medir o primeiro card

  // Recalcula a altura do container sempre que muda o número de cards
  useEffect(() => {
    if (!cardRef.current) return;

    const update = () => {
      const h = cardRef.current!.getBoundingClientRect().height;
      setStackHeight(h + (cards.length - 1) * spacing);
    };

    // 1ª medição
    update();

    // Observa alterações de tamanho do primeiro card
    const ro = new ResizeObserver(update);
    ro.observe(cardRef.current);

    return () => ro.disconnect();
  }, [cards.length]);

  return (
    <div
      className={styles.container}
      style={{ height: `${stackHeight}px` }}
    >
      {cards.map((card, i) => {
        const top = (cards.length - 1 - i) * spacing;
        const zIdx = cards.length - i;

        return (
          <div
            key={card.id}
            ref={i === 0 ? cardRef : undefined}
            className={styles.cardWrapper}
            style={{ top, zIndex: zIdx }}
            onClick={() => {
              if (i === 0) return;
              const clicked = cards[i];
              const first = cards[0];
              const remaining = cards.filter(
                c => c.id !== clicked.id && c.id !== first.id
              );
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

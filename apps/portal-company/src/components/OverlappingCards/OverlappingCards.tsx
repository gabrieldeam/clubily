'use client';

import { useEffect, useRef, useState } from 'react';
import type { InstanceDetail, TemplateReadFull } from '@/types/loyalty';
import SimpleCard from '@/components/SimpleCard/SimpleCard';
import styles from './OverlappingCards.module.css';

interface Props {
  cards: InstanceDetail[];
  allTemplates: TemplateReadFull[];
  loadingTemplates?: boolean;
  onIssue: (templateId: string) => void;
  onOpen: (card: InstanceDetail) => void;
  /** nome do dono para exibir no cartão */
  ownerName?: string;
}

export default function OverlappingCards({
  cards: initial,
  allTemplates,
  loadingTemplates = false,
  onIssue,
  onOpen,
  ownerName,
}: Props) {
  const [cards, setCards] = useState(initial);

  useEffect(() => {
    setCards(initial);
  }, [initial]);

  const [stackHeight, setStackHeight] = useState(0);
  const spacing = 110;
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current || cards.length === 0) {
      setStackHeight(0);
      return;
    }

    const update = () => {
      const h = cardRef.current!.getBoundingClientRect().height;
      setStackHeight(h + (cards.length - 1) * spacing);
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(cardRef.current);

    return () => ro.disconnect();
  }, [cards.length]);

  const ownedTemplateIds = new Set(cards.map(c => c.template.id));
  const available = allTemplates.filter(t => !ownedTemplateIds.has(t.id));

  return (
    <div>
      {cards.length > 0 && (
        <div className={styles.container} style={{ height: `${stackHeight}px` }}>
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
                  if (i === 0) {
                    onOpen(card);
                    return;
                  }
                  const clicked = cards[i];
                  const first = cards[0];
                  const remaining = cards.filter(
                    c => c.id !== clicked.id && c.id !== first.id
                  );
                  setCards([clicked, ...remaining, first]);
                }}
              >
                <SimpleCard card={card} disableModal ownerName={ownerName} />
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.availableSection}>
        <h4
          className={styles.availableTitle}
          style={{ marginTop: 8, marginBottom: 12, fontSize: 16, fontWeight: 600 }}
        >
          Templates disponíveis para este cliente
        </h4>

        {loadingTemplates ? (
          <p>Carregando templates…</p>
        ) : available.length ? (
          <div
            className={styles.availableGrid}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 12,
            }}
          >
            {available.map(t => (
              <div key={t.id}>
                <SimpleCard
                  template={t}
                  ctaLabel="Emitir"
                  onCta={() => onIssue(t.id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <p>Não há templates disponíveis para emissão.</p>
        )}
      </div>
    </div>
  );
}

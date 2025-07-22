'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from './WelcomeSlider.module.css';

interface WelcomeSliderProps {
  onClose: () => void;
}

const slides = [
  {
    title: 'Bem‑vindo, Parceiro Clubily!',
    description: 'Conecte sua empresa à maior plataforma de fidelidade e engaje seus clientes.',
    image: '/slides/slide1.png',
  },
  {
    title: 'Crie seus Programas de Fidelidade',
    description: 'Monte campanhas de cashback, pontos e cartões de fidelidade em poucos cliques.',
    image: '/slides/company-slide2.png',
  },
  {
    title: 'Venda Mais com a Clubily',
    description: 'Aumente vendas e retenção de clientes usando nossas ferramentas de fidelização.',
    image: '/slides/slide5.svg',
  },
];

export default function WelcomeSlider({ onClose }: WelcomeSliderProps) {
  const [index, setIndex] = useState(0);

  const prev = () => setIndex(i => Math.max(i - 1, 0));
  const next = () => setIndex(i => Math.min(i + 1, slides.length - 1));

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
        <div className={styles.content}>
          <div className={styles.imageWrapper}>
            <Image
              src={slides[index].image}
              alt={slides[index].title}
              fill
              style={{ objectFit: 'contain' }}
            />
          </div>
          <h2>{slides[index].title}</h2>
          <p>{slides[index].description}</p>
        </div>
        <div className={styles.footer}>
          {index > 0 && (
            <button className={styles.navBtn} onClick={prev}>
              ← Anterior
            </button>
          )}
          {index < slides.length - 1 ? (
            <button className={styles.navBtn} onClick={next}>
              Próximo →
            </button>
          ) : (
            <button className={styles.finishBtn} onClick={onClose}>
              Começar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

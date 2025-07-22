'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from './WelcomeSlider.module.css';

interface WelcomeSliderProps {
  onClose: () => void;
}

const slides = [
  {
    title: 'Bem‑vindo ao Clubily!',
    description: 'Descubra e gerencie seus programas de fidelidade em um só lugar.',
    image: '/slides/slide1.png',
  },
  {
    title: 'Acompanhe seu cashback',
    description: 'Veja as empresas que oferecem cashback, acompanhe o valor acumulado e saiba quando seus créditos expiram.',
    image: '/slides/slide2.png',
  },
  {
    title: 'Colete pontos e conquiste prêmios',
    description: 'Descubra empresas que oferecem pontos, confira as regras para ganhar e troque seus pontos por produtos na Loja Clubily.',
    image: '/slides/slide3.png',
  },
  {
    title: 'Cartão de Fidelidade Digital',
    description: 'Encontre programas com cartões de fidelidade, acumule carimbos a cada compra e ganhe brindes ao atingir suas metas.',
    image: '/slides/slide4.png',
  },
  {
    title: 'Venha descobrir a felicidade com a Clubily',
    description: 'Junte‑se agora e transforme suas compras em experiências incríveis!',
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
              Anterior
            </button>
          )}
          {index < slides.length - 1 ? (
            <button className={styles.navBtn} onClick={next}>
              Próximo
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

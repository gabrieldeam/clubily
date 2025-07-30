'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Gift, Zap } from 'lucide-react';
import styles from './RewardsSection.module.css';

interface Reward {
  id: number;
  name: string;
  description: string;
  points: number;
  image: string;
}

const RewardsSection = () => {
  const rewardProducts: Reward[] = [
    { id: 1, name: "Caneca Exclusiva", description: "Caneca de cerâmica premium", points: 300, image: "/reward.jpg" },
    { id: 2, name: "Fone Bluetooth", description: "Áudio de alta qualidade", points: 1200, image: "/reward.jpg" },
    { id: 3, name: "Camiseta Estilosa", description: "Algodão orgânico", points: 800, image: "/reward.jpg" },
    { id: 4, name: "Cafeteira Premium", description: "Café na hora que quiser", points: 2500, image: "/reward.jpg" },
    { id: 5, name: "Smartwatch", description: "Monitoramento de saúde", points: 3500, image: "/reward.jpg" },
    { id: 6, name: "Caixa de Chocolate", description: "Seleção premium", points: 500, image: "/reward.jpg" },
  ];

  // posições iniciais distribuídas em Y
  const positions = useMemo(
    () =>
      rewardProducts.map((_, i) => ({
        top: `${10 + (i % 3) * 25}%`,
        left: `${-30}%`, // começam fora da tela à esquerda
      })),
    []
  );

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>Descubra nossa Loja de Recompensas</h2>
        <p className={styles.subtitle}>
          Produtos incríveis esperando para serem resgatados com seus pontos
        </p>
      </div>

      <div className={styles.productContainer}>
        {rewardProducts.map((product, index) => (
          <motion.div
            key={product.id}
            className={styles.productCard}
            style={positions[index]}
            animate={{
              x: ['-30vw', '130vw'],    // desliza da esquerda para fora à direita
              y: [0, -15, 0],           // flutua para cima e volta
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: 'loop',
                ease: 'linear',
                duration: 20 + index * 5,  // velocidades variadas
                delay: index * 2,
              },
              y: {
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut',
                duration: 4,
                delay: index * 0.5,
              },
            }}
          >
            <div className={styles.productImage}>
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 80vw, 260px"
                style={{ objectFit: 'cover', borderRadius: '16px' }}
              />
            </div>
            <div className={styles.productInfo}>
              <h3>{product.name}</h3>
              <p className={styles.points}>{product.points}pts</p>
              <button className={styles.rescueButton}>Ver na loja</button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className={styles.features}>
        <div className={styles.feature}>
          <Zap className={styles.featureIcon} />
          <div>
            <h4>Resgate imediato</h4>
            <p>Seus prêmios disponíveis em minutos</p>
          </div>
        </div>
        <div className={styles.feature}>
          <Gift className={styles.featureIcon} />
          <div>
            <h4>+1000 produtos</h4>
            <p>Variedade de prêmios para todos os gostos</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RewardsSection;

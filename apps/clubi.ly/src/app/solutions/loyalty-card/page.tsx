import Image from 'next/image';
import styles from './page.module.css';

export const metadata = { title: 'Cartão Fidelidade • Clubily' };

export default function LoyaltyCardPage() {
  return (
    <article className={styles.wrapper}>
      <h1>Cartões digitais e carimbos</h1>
      <p>
        Monte cartões com qualquer número de carimbos, defina recompensas
        automáticas ao completar e ofereça uma experiência gamificada aos seus
        clientes.
      </p>
      <Image
        src="/images/loyalty-dashboard.png"
        alt="Dashboard de cartões"
        width={900}
        height={540}
        className={styles.img}
      />
    </article>
  );
}

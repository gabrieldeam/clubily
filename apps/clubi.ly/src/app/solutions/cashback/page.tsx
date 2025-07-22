import Image from 'next/image';
import styles from './page.module.css';

export const metadata = { title: 'Cashback • Clubily' };

export default function CashbackPage() {
  return (
    <article className={styles.wrapper}>
      <h1>Cashback inteligente</h1>
      <p>
        Defina um percentual de retorno e a Clubily cuida do resto. Seus clientes
        acumulam crédito em tempo real – sem dor de cabeça.
      </p>
      <Image
        src="/images/cashback-dashboard.png"
        alt="Dashboard de cashback"
        width={900}
        height={540}
        className={styles.img}
      />
    </article>
  );
}

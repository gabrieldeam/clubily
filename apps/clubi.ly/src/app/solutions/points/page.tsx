import Image from 'next/image';
import styles from './page.module.css';

export const metadata = { title: 'Pontos • Clubily' };

export default function PointsPage() {
  return (
    <article className={styles.wrapper}>
      <h1>Pontos personalizáveis</h1>
      <p>
        Crie regras de distribuição por primeira compra, frequência, recorrência
        ou filial específica. Seus clientes trocam pontos por recompensas
        físicas ou digitais.
      </p>
      <Image
        src="/images/points-dashboard.png"
        alt="Dashboard de pontos"
        width={900}
        height={540}
        className={styles.img}
      />
    </article>
  );
}

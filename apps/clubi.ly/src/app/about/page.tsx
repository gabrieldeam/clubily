import Image from 'next/image';
import styles from './page.module.css';

export const metadata = { title: 'Sobre nós • Clubily' };

export default function About() {
  return (
    <article className={styles.wrapper}>
      <h1>Nosso Propósito</h1>
      <p>
        A Clubily nasceu para democratizar programas de fidelidade no Brasil,
        oferecendo às pequenas e médias empresas as mesmas ferramentas usadas
        por grandes varejistas — de forma simples e acessível.
      </p>

      <section className={styles.section}>
        <h2>Nossa Jornada</h2>
        <p>
          Fundada em 2024 em Vitória‑ES, reunimos especialistas em tecnologia,
          marketing e varejo. Hoje já ajudamos centenas de negócios a aumentarem
          sua recorrência e ticket médio.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Time</h2>
        <div className={styles.teamGrid}>
          <figure>
            <Image src="/images/founder1.jpg" alt="" width={140} height={140} />
            <figcaption>Gabriel Machado<br/><small>CEO &amp; Founder</small></figcaption>
          </figure>
          <figure>
            <Image src="/images/founder2.jpg" alt="" width={140} height={140} />
            <figcaption>Ana Silva<br/><small>CTO</small></figcaption>
          </figure>
          {/* adicione outros membros */}
        </div>
      </section>
    </article>
  );
}

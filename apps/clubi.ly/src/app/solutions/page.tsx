import Link from 'next/link';
import styles from './page.module.css';

export default function Solutions() {
  const items = [
    { href: 'cashback', label: 'Cashback' },
    { href: 'points', label: 'Pontos' },
    { href: 'loyalty-card', label: 'Cartão Fidelidade' }
  ];
  return (
    <section className={styles.wrapper}>
      <h1>Nossas Soluções</h1>
      <ul className={styles.grid}>
        {items.map(({ href, label }) => (
          <li key={href} className={styles.card}>
            <h2>{label}</h2>
            <p>Veja como o {label} da Clubily funciona.</p>
            <Link href={`/solutions/${href}`}>Descobrir →</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

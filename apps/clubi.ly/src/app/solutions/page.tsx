// app/solutions/page.tsx
import { DollarSign, Star, CreditCard } from 'lucide-react';
import Link from 'next/link';
import styles from './page.module.css';

export const metadata = {
  title: 'Clubily - Nossas Soluções',
};

export default function Solutions() {
  const items = [
    { href: 'cashback', label: 'Cashback', icon: <DollarSign size={28} /> },
    { href: 'points', label: 'Pontos', icon: <Star size={28} /> },
    { href: 'loyalty-card', label: 'Cartão Fidelidade', icon: <CreditCard size={28} /> },
  ];

  return (
    <main className={styles.container}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Nossas Soluções</h1>
          <p className={styles.heroSubtitle}>
            Descubra como cada solução da Clubily pode transformar a fidelização dos seus clientes.
          </p>
        </div>
      </section>

      {/* Grid de soluções */}
      <section className={styles.section}>
        <div className={styles.featureGrid}>
          {items.map(({ href, label, icon }) => (
            <div key={href} className={styles.featureCard}>
              <div className={styles.featureIconWrapper} aria-hidden="true">{icon}</div>
              <h3 className={styles.featureTitle}>{label}</h3>
              <p className={styles.featureDescription}>Veja como o {label} da Clubily funciona.</p>
              <Link
                href={`/solutions/${href}`}
                className={styles.primaryBtn}
                aria-label={`Descobrir mais sobre ${label}`}
              >
                Descobrir →
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

// app/solutions/page.tsx
import { DollarSign, Star, CreditCard } from 'lucide-react';
import Link from 'next/link';
import styles from './page.module.css';

export const metadata = {
  title: 'Clubily - Nossas Soluções',
};

export default function Solutions() {
  const items = [
    { href: 'cashback', label: 'Cashback', icon: <DollarSign size={32} /> },
    { href: 'points', label: 'Pontos', icon: <Star size={32} /> },
    { href: 'loyalty-card', label: 'Cartão Fidelidade', icon: <CreditCard size={32} /> },
  ];

  return (
    <main className={styles.container}>
      {/* Hero for Solutions */}
      <section className={styles.hero} style={{ padding: '4rem 0', textAlign: 'center', background: 'linear-gradient(135deg, #1a1a1a 0%, #000 100%)' }}>
        <div>
          <h1 className={styles.heroTitle}>Nossas Soluções</h1>
          <p className={styles.heroSubtitle} style={{ maxWidth: '600px', margin: '1rem auto', color: '#fff' }}>
            Descubra como cada solução da Clubily pode transformar a fidelização dos seus clientes.
          </p>
        </div>
      </section>

      {/* Solutions Grid */}
      <section className={styles.section}>
        <div className={styles.featureGrid}>
          {items.map(({ href, label, icon }) => (
            <div key={href} className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>{icon}</div>
              <h3>{label}</h3>
              <p>Veja como o {label} da Clubily funciona.</p>
              <Link href={`/solutions/${href}`} className={styles.primaryBtn}>
                Descobrir →
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
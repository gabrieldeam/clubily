import PricingTable from '@/components/PricingTable/PricingTable';
import styles from './page.module.css';

export const metadata = { title: 'Clubily para Empresas' };

export default function Companies() {
  return (
    <section className={styles.wrapper}>
      <h1>Fidelização sem complicação</h1>
      <p>
        Crie seu programa, compre créditos e comece a premiar clientes hoje mesmo.
      </p>
      {/* Coloque screenshots ou mock‑ups aqui */}
      <PricingTable />
    </section>
  );
}

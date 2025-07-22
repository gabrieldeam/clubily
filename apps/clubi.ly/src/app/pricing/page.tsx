import PricingTable from '@/components/PricingTable/PricingTable';
import styles from './page.module.css';

export const metadata = { title: 'Planos e Preços • Clubily' };

export default function Pricing() {
  return (
    <section className={styles.wrapper}>
      <h1>Planos e Preços</h1>
      <p>
        Escolha o plano que melhor se ajusta ao tamanho do seu negócio. Sem
        contratos longos, cancele quando quiser.
      </p>

      <PricingTable />

      <small className={styles.note}>
        * Impostos não incluídos. Consulte nossos{' '}
        <a href="/legal/terms">Termos de Uso</a>.
      </small>
    </section>
  );
}

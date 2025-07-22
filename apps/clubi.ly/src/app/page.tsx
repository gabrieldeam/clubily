import Hero from '@/components/Hero/Hero';
import FeatureCard from '@/components/FeatureCard/FeatureCard';
import { DollarSign, Star, Stamp } from 'lucide-react';
import styles from './page.module.css';

export default function Home() {
  return (
    <>
      <Hero />

      <section className={styles.triad}>
        <FeatureCard icon={<DollarSign />} title="Cashback inteligente">
          Defina percentuais e deixe a Clubily calcular os retornos automaticamente.
        </FeatureCard>
        <FeatureCard icon={<Star />} title="Pontos personalizáveis">
          Regras de primeira compra, frequência, filial e muito mais.
        </FeatureCard>
        <FeatureCard icon={<Stamp />} title="Cartões digitais">
          Crie cartões, defina carimbos necessários e recompense ao completar.
        </FeatureCard>
      </section>

      <section className={styles.cta}>
        <h2>Comece a fidelizar hoje mesmo</h2>
        <p>Cadastre‑se e ganhe <strong>100 créditos</strong> de boas‑vindas.</p>
        <a href="/companies" className={styles.ctaBtn}>Criar conta gratuita</a>
      </section>
    </>
  );
}

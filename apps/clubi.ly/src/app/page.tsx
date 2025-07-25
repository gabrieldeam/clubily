import Hero from '@/components/Hero/Hero';
import FeatureCard from '@/components/FeatureCard/FeatureCard';
import ValueProposition from '@/components/ValueProposition/ValueProposition';
import Testimonial from '@/components/Testimonial/Testimonial';
import { DollarSign, Star, Stamp, BarChart, Smartphone, Gift, Users, Zap, CreditCard } from 'lucide-react';
import styles from './page.module.css';

export default function Home() {
  return (
    <>
      <Hero />
      
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Tudo o que você precisa em uma única plataforma</h2>
          <p>Ferramentas poderosas para fidelizar clientes e aumentar suas vendas</p>
        </div>
        
        <div className={styles.triad}>
          <FeatureCard icon={<DollarSign size={48} />} title="Cashback inteligente">
            Defina percentuais por produto, categoria ou valor de compra. O sistema calcula automaticamente os retornos.
          </FeatureCard>
          <FeatureCard icon={<Star size={48} />} title="Programas de pontos">
            Crie regras personalizadas: primeira compra, frequência, valor mínimo e muito mais.
          </FeatureCard>
          <FeatureCard icon={<Stamp size={48} />} title="Cartões fidelidade">
            Digitalize seus cartões de fidelidade com carimbos automáticos e recompensas instantâneas.
          </FeatureCard>
        </div>
      </section>

      <ValueProposition 
        tag="Para empresas"
        title="Transforme clientes em fãs da sua marca"
        description="Nossa plataforma oferece tudo que você precisa para criar programas de fidelidade que realmente engajam"
        features={[
          { icon: <BarChart />, title: "Dashboard intuitivo", description: "Acompanhe métricas de desempenho em tempo real" },
          { icon: <Smartphone />, title: "Programas personalizado", description: "Seu programa com suas regras para e atrair clientes" },
          { icon: <Gift />, title: "Gestão de recompensas", description: "Distribua pontos para seus clientes para eles trocar por recompensas" },
          { icon: <Users />, title: "Segmentação avançada", description: "Identifique seus melhores clientes" }
        ]}
        image="/dashboard.png" // Exemplo: https://images.unsplash.com/photo-1460925895917-afdab827c52f
        cta={{ text: "Experimente grátis", link: "/companies" }}
        sectionBorderRadius="20px 20px 0 0"
        bgColor="light"
      />

      <ValueProposition 
        tag="Para clientes"
        title="Tudo em um só lugar, benefícios em todo lugar"
        description="Gerencie todos os seus programas de fidelidade de forma simples e prática"
        features={[
          { icon: <Zap />, title: "Acumule instantaneamente", description: "Cashback e pontos creditados na hora" },
          { icon: <CreditCard />, title: "Cartões digitais", description: "Todos seus cartões de fidelidade no celular" },
          { icon: <Gift />, title: "Resgate quando quiser", description: "Troque pontos por produtos e serviços" },
          { icon: <Star />, title: "Descubra empresas", description: "Descubra empresas confiáveis e ganhe mais por isso" }
        ]}
        image="/ly.png" // Exemplo: https://images.unsplash.com/photo-1607082350899-7e105aa886ae
        cta={{ text: "Ver meus programas", link: "/clients" }}
        bgColor="gradient"
        sectionBorderRadius=" 0 0 20px 20px"
        reverse
      />

      <section className={`${styles.section} ${styles.testimonialsSection}`}>
        <div className={styles.sectionHeader}>
          <h2>Quem usa recomenda</h2>
          <p>Mais de 500 empresas já transformaram sua relação com clientes</p>
        </div>
        
        <div className={styles.testimonialsGrid}>
          <Testimonial 
            quote="Aumentamos em 30% o ticket médio com o programa de pontos personalizado da Clubily."
            author="Carla Mendes"
            role="Gerente de Marketing"
            company="Café & Cia"
          />
          <Testimonial 
            quote="Meus clientes amam o cashback automático! E eu amo como é fácil controlar tudo pela plataforma."
            author="Roberto Alves"
            role="Proprietário"
            company="Loja do Roberto"
          />
          <Testimonial 
            quote="Centralizar meus benefícios em um só app mudou minha forma de consumir. Adoro resgatar meus pontos!"
            author="Fernanda Oliveira"
            role="Cliente"
            company=""
          />
        </div>
      </section>

      <section className={styles.cta}>
        <h2>Comece a fidelizar hoje mesmo</h2>
        <p>Cadastre‑se e ganhe <strong>100 créditos</strong> de boas‑vindas após a conta ser ativa.</p>
        <a href="/companies" className={styles.ctaBtn}>Criar conta gratuita</a>
      </section>
    </>
  );
}

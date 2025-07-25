// app/about/page.tsx
import Image from 'next/image';
import styles from './page.module.css';
import { Globe, Target, Eye, Heart, BarChart, Users } from 'lucide-react';

export const metadata = { title: 'Sobre nós • Clubily' };

export default function About() {
  return (
    <div>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Mais que uma plataforma, uma revolução na fidelização
          </h1>

          <p className={styles.heroSubtitle}>
            Democratizando programas de fidelidade para que todo negócio, independente
            do tamanho, possa criar relacionamentos duradouros com seus clientes.
          </p>
        </div>

        {/* Logo — fica à direita no desktop e vai para baixo no mobile */}
        <div className={styles.heroImageWrapper}>
          <Image
            src="/logoClubily.svg"
            alt="Logo Clubily"
            fill
            priority
            className={styles.heroImage}
          />
        </div>
      </section>


      {/* Manifesto */}
      <section className={styles.manifesto}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}>
            <Globe size={32} />
          </div>
          <h2>Nosso Manifesto</h2>
        </div>
        <div className={styles.manifestoContent}>
          <p>
            Vemos grandes redes investindo alto em tecnologia de fidelização, enquanto pequenos empreendedores ficam sem acesso a ferramentas eficazes.
          </p>
          <p>
            A <strong>Clubily</strong> nasce agora para mudar esse cenário. Nossa plataforma coloca o poder da fidelização na palma da mão de quem está começando, com soluções criadas a partir de feedback real.
          </p>
          <p>
            Queremos construir esta jornada lado a lado com você, co-criando funcionalidades e impactando positivamente sua relação com os clientes.
          </p>
        </div>
      </section>

      {/* Visão, Missão e Valores */}
      <section className={styles.valuesSection}>
        <div className={styles.valuesGrid}>
          <div className={styles.valueCard}>
            <div className={styles.valueIcon} style={{ backgroundColor: 'rgba(106, 53, 255, 0.1)' }}>
              <Eye size={24} color="#6A35FF" />
            </div>
            <h3>Visão</h3>
            <p>
              Ser referência em fidelização para pequenos negócios no Brasil, criando conexões reais e duradouras.
            </p>
          </div>

          <div className={styles.valueCard}>
            <div className={styles.valueIcon} style={{ backgroundColor: 'rgba(255, 107, 0, 0.1)' }}>
              <Target size={24} color="#FF6B00" />
            </div>
            <h3>Missão</h3>
            <p>
              Oferecer soluções de fidelidade intuitivas, acessíveis e personalizáveis, permitindo que cada cliente volte sempre.
            </p>
          </div>

          <div className={styles.valueCard}>
            <div className={styles.valueIcon} style={{ backgroundColor: 'rgba(40, 167, 69, 0.1)' }}>
              <Heart size={24} color="#28A745" />
            </div>
            <h3>Valores</h3>
            <ul className={styles.valuesList}>
              <li><span>Acessibilidade</span> - Fidelização para todos</li>
              <li><span>Simplicidade</span> - Tecnologia que qualquer um usa</li>
              <li><span>Transparência</span> - Sem pegadinhas ou custos ocultos</li>
              <li><span>Impacto Real</span> - Resultados que você vê</li>
              <li><span>Comunidade</span> - Crescemos juntos</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Jornada */}
      <section className={styles.journey}>

        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}>
            <BarChart size={32} />
          </div>
          <h2>Nossa Jornada</h2>
        </div>

        <div className={styles.timeline}>
          <div className={styles.timelineItem}>
            <div className={styles.timelineYear}>2025</div>
            <div className={styles.timelineContent}>
              <h3>Início das Operações</h3>
              <p>
                Lançamos a Clubily com a missão de criar a plataforma de fidelização mais simples e eficiente para PMEs.
              </p>
            </div>
          </div>

          <div className={styles.timelineItem}>
            <div className={styles.timelineYear}>Futuro</div>
            <div className={styles.timelineContent}>
              <h3>Co-criando com Clientes</h3>
              <p>
                Desenvolveremos novas funcionalidades baseadas no seu feedback, construindo juntos o futuro da fidelização.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Time */}
      <section className={styles.team}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}>
            <Users size={32} />
          </div>
          <h2>Nosso Time</h2>
          <p className={styles.teamSubtitle}>
            Pessoas apaixonadas por tornar a fidelização acessível a todos
          </p>
        </div>

        <div className={styles.teamGrid}>
          <div className={styles.teamMember}>
            <div className={styles.memberImage}>
              <Image src="/images/founder1.jpg" alt="Gabriel Machado" width={180} height={180} />
            </div>
            <h3>Gabriel Machado</h3>
            <p className={styles.memberRole}>CEO & Founder</p>
            <p className={styles.memberBio}>
              Ex-gerente de marketing com 10 anos de experiência em varejo. Sonha em ver pequenos negócios competindo em igualdade com grandes redes.
            </p>
          </div>          
        </div>
      </section>

      {/* CTA Final */}
      <section className={styles.finalCta}>
        <h2>Pronto para transformar seus clientes em fãs fiéis?</h2>
        <p>Comece hoje mesmo com 100 créditos grátis</p>
        <a href="/signup" className={styles.ctaBtn}>Criar conta gratuita</a>
        <div className={styles.ctaNote}>Sem compromisso. Cancele quando quiser.</div>
      </section>
    </div>
  );
}

// clientLanding/page.tsx
"use client";
import Link from "next/link";
import { MapPin, DollarSign, Star, CreditCard, Gift, Zap, Users, Share2, TrendingUp, ArrowRight, CheckCircle } from "lucide-react";
import Image from "next/image";
import styles from "./page.module.css";


// Simulação de produtos para a loja de recompensas
const rewardProducts = [
  { id: 1, name: "Caneca Exclusiva", description: "Caneca de cerâmica premium", points: 300, image: "/reward1.jpg" },
  { id: 2, name: "Fone Bluetooth", description: "Áudio de alta qualidade", points: 1200, image: "/reward2.jpg" },
  { id: 3, name: "Camiseta Estilosa", description: "Algodão orgânico", points: 800, image: "/reward3.jpg" },
  { id: 4, name: "Cafeteira Premium", description: "Café na hora que quiser", points: 2500, image: "/reward4.jpg" },
];

export default function ClientLanding() {
  return (
    <main className={styles.container}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Transforme suas compras em <span className={styles.highlight}>recompensas reais</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Descubra estabelecimentos perto de você, acumule benefícios e troque por produtos exclusivos. Tudo em um só lugar.
          </p>
          <div className={styles.ctaContainer}>
            <Link href="/signup" className={styles.primaryBtn}>Comece Grátis</Link>
            <Link href="#como-funciona" className={styles.secondaryBtn} scroll>
              <span>Como funciona</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
        <figure className={styles.heroImage}>
          <Image src="/client-hero.png" alt="Cliente satisfeito" fill priority sizes="(max-width: 768px) 80vw, 40vw" />
        </figure>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className={styles.howItWorks}>
        <header>
          <h2 className={styles.sectionTitle}>Simples, rápido e recompensador</h2>
          <p className={styles.sectionSubtitle}>Em apenas 3 passos você começa a ganhar benefícios</p>
        </header>
        <ol className={styles.stepsContainer}>
          <li className={styles.stepCard}>
            <span className={styles.stepNumber}>1</span>
            <h3>Cadastre-se</h3>
            <p>Crie sua conta gratuita em menos de 2 minutos</p>
          </li>
          <li className={styles.stepDivider} aria-hidden="true" />
          <li className={styles.stepCard}>
            <span className={styles.stepNumber}>2</span>
            <h3>Compre e acumule</h3>
            <p>Ganhe pontos, cashback ou carimbos em cada compra</p>
          </li>
          <li className={styles.stepDivider} aria-hidden="true" />
          <li className={styles.stepCard}>
            <span className={styles.stepNumber}>3</span>
            <h3>Resgate prêmios</h3>
            <p>Troque seus pontos por produtos ou benefícios</p>
          </li>
        </ol>
      </section>

      {/* Funcionalidades */}
      <section className={styles.featuresSection}>
        <header>
          <h2 className={styles.sectionTitle}>O que você ganha com Clubily</h2>
          <p className={styles.sectionSubtitle}>Um ecossistema completo para recompensar sua fidelidade</p>
        </header>
        <div className={styles.featuresGrid}>
          {[
            { icon: MapPin, title: "Lojas perto de você", text: "Busque estabelecimentos por localização e descubra programas de fidelidade ativos." },
            { icon: DollarSign, title: "Cashback automático", text: "Acompanhe quanto acumulou em cada compra e resgate quando quiser." },
            { icon: Star, title: "Pontos que não expiram", text: "Acumule pontos flexíveis e troque por diferentes categorias de produtos." },
            { icon: CreditCard, title: "Cartões digitais", text: "Mantenha todos os seus cartões organizados em um único lugar." },
            { icon: Gift, title: "Loja de recompensas", text: "Escolha entre centenas de produtos de parceiros confiáveis." },
            { icon: Zap, title: "Resgate imediato", text: "Benefícios ativados na hora, direto no estabelecimento." },
          ].map(({ icon: Icon, title, text }, i) => (
            <article key={i} className={styles.featureCard}>
              <span className={styles.featureIconContainer}><Icon size={28} className={styles.featureIcon} /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Loja de Recompensas */}
      <section className={styles.rewardsSection}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Loja de Recompensas</h2>
          <p className={styles.sectionSubtitle}>Troque seus pontos por produtos incríveis</p>
        </header>
        <div className={styles.productGrid}>
          {rewardProducts.map((product) => (
            <article key={product.id} className={styles.productCard}>
              <figure className={styles.imageWrapper}>
                <Image src={product.image} alt={product.name} fill sizes="(max-width: 600px) 100vw, 280px" />
              </figure>
              <div className={styles.productInfo}>
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <footer className={styles.productFooter}>
                  <span className={styles.pointsCost}>{product.points} pts</span>
                  <button className={styles.redeemBtn} aria-label={`Resgatar ${product.name}`}>
                    Resgatar
                    <ArrowRight size={16} />
                  </button>
                </footer>
              </div>
            </article>
          ))}
        </div>
        <div className={styles.rewardsFooter}>
          <Link href="/rewards" className={styles.viewAllBtn}>
            Ver todos os prêmios
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Programa de Indicação */}
      <section className={styles.referralSection}>
        <div className={styles.referralContent}>
          <div className={styles.referralText}>
            <h2 className={styles.sectionTitleWithIcon}>
              <Share2 size={32} className={styles.referralIcon} /> Indique empresas e ganhe dinheiro
            </h2>
            <div className={styles.referralBenefits}>
              {[
                { icon: TrendingUp, text: "Ganhe comissão sobre as transações" },
                { icon: DollarSign, text: "Pagamentos direto na sua conta" },
                { icon: Users, text: "Sem limite de indicações" },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className={styles.benefitCard}>
                  <Icon size={24} />
                  <p>{text}</p>
                </div>
              ))}
            </div>
            <h3 className={styles.referralSubtitle}>Como funciona:</h3>
            <ul className={styles.referralSteps}>
              {[
                { title: "Crie seu código único", desc: "Gere um código de indicação pessoal na sua área do cliente" },
                { title: "Compartilhe com empresas", desc: "Indique estabelecimentos que você gosta para se cadastrarem" },
                { title: "Ganhe comissões", desc: "Receba % sobre compras de créditos feitas pelo estabelecimento" },
              ].map(({ title, desc }, i) => (
                <li key={title}>
                  <span className={styles.stepIndicator}>{i + 1}</span>
                  <div>
                    <h4>{title}</h4>
                    <p>{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className={styles.referralCta}>
              <Link href="/dashboard/referral" className={styles.primaryBtn}>Criar meu código de indicação</Link>
              <p className={styles.note}>Disponível para clientes cadastrados</p>
            </div>
          </div>
          <figure className={styles.referralImage}>
            <Image src="/referral-dashboard.png" alt="Painel de indicações" fill sizes="(max-width: 768px) 80vw, 40vw" />
          </figure>
        </div>
      </section>

      {/* Vantagens */}
      <section className={styles.benefitsSection}>
        <h2 className={styles.sectionTitle}>Por que milhares de clientes escolhem Clubily</h2>
        <div className={styles.benefitsGrid}>
          {[
            { title: "Totalmente gratuito", text: "Não cobramos nenhuma taxa para você participar." },
            { title: "Segurança garantida", text: "Dados e transações protegidos com criptografia." },
            { title: "Suporte dedicado", text: "Equipe pronta para ajudar quando precisar." },
          ].map(({ title, text }, i) => (
            <article key={i} className={styles.benefitCard}>
              <CheckCircle className={styles.benefitIcon} />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className={styles.finalCta}>
        <div className={styles.ctaContent}>
          <h2>Comece a transformar suas compras em recompensas hoje mesmo!</h2>
          <p>Junte-se a mais de 50.000 clientes satisfeitos</p>
          <Link href="/signup" className={styles.ctaBtn}>Criar Conta Gratuita</Link>
          <div className={styles.ctaFooter}>
            <Image src="/security-badges.png" alt="Certificados de segurança" width={300} height={40} />
          </div>
        </div>
      </section>
    </main>
  );
}
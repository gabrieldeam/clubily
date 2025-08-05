// clientLanding/page.tsx
"use client";
import Link from "next/link";
import { MapPin, ShoppingBag, UserPlus,Award, DollarSign, Star, CreditCard, Gift, Zap, Users, Share2, TrendingUp, ArrowRight, CheckCircle } from "lucide-react";
import Image from "next/image";
import styles from "./page.module.css";
import RewardsSection from '@/components/RewardsSection/RewardsSection';
import { motion } from 'framer-motion';



export default function ClientLanding() {
  const featureVariants = {
    hover: { 
      y: -10,
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      transition: { duration: 0.3 }
    }
  };

  const features = [
  { 
    icon: MapPin, 
    title: "Geolocalização inteligente", 
    text: "Descubra ofertas exclusivas perto de você em tempo real",
    badge: "NOVO"
  },
  { 
    icon: DollarSign, 
    title: "Cashback instantâneo", 
    text: "Receba parte do valor gasto de volta imediatamente após cada compra" 
  },
  { 
    icon: Star, 
    title: "Pontos vitalícios", 
    text: "Seus pontos nunca expiram e rendem bônus trimestrais" 
  },
  { 
    icon: CreditCard, 
    title: "Carteira digital", 
    text: "Todos seus cartões de fidelidade em um único lugar com NFC integrado" 
  },
  { 
    icon: Gift, 
    title: "Loja premium", 
    text: "Mais de 1.000 prêmios de parceiros selecionados" 
  },
  { 
    icon: Zap, 
    title: "Resgate ultrarrápido", 
    text: "Troque seus pontos por benefícios em menos de 15 segundos" 
  },
  { 
    icon: ShoppingBag, 
    title: "Ofertas personalizadas", 
    text: "Promoções exclusivas baseadas no seu histórico de compras" 
  },
  { 
    icon: UserPlus, 
    title: "Programa de indicação", 
    text: "Ganhe bônus por cada amigo que se juntar ao Clubily" 
  }
];

  return (
    <main className={styles.container}>
      {/* Hero */}
      <section className={styles.content}>
        
        <div className={styles.hero}>
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
         <div className={styles.heroImage}>
          <div className={styles.rightPanel}>
          <Image
            src="/lyCapy.png"
            alt="Moeda GB"
            width={450}   
            height={450}
            priority
          />
        </div>
        </div>
      </div>
      
      <div className={styles.section}>
        <div 
        id="como-funciona"
        className={styles.header}
      >
        <h2 className={styles.title}>Sua jornada de recompensas começa aqui</h2>
        <p className={styles.subtitle}>Descubra como transformar suas compras diárias em benefícios extraordinários</p>
      </div>

      {/* Passos melhorados */}
      <ol 
        className={styles.steps}
      >
        <li className={styles.step}>
          <div className={styles.stepHeader}>
            <div className={styles.displayFlex}>
              <div className={styles.stepNumber}>1</div>
              <UserPlus size={48} className={styles.stepIcon} />
            </div>
          </div>
          <div className={styles.stepContent}>
            <h3>Cadastro rápido e gratuito</h3>
            <p>Crie sua conta em menos de 2 minutos e comece imediatamente</p>
            <ul className={styles.stepBenefits}>
              <li>Sem custos ocultos</li>
              <li>Sem necessidade de cartão físico</li>
              <li>Integração com redes sociais</li>
            </ul>
          </div>
        </li>

        <li className={styles.step}>
          <div className={styles.stepHeader}>
            <div className={styles.displayFlex}>
              <div className={styles.stepNumber}>2</div>
              <ShoppingBag size={48} className={styles.stepIcon} />
            </div>
          </div>
          <div className={styles.stepContent}>
            <h3>Compre e acumule</h3>
            <p>Ganhe recompensas a cada compra em nossos parceiros</p>
            <ul className={styles.stepBenefits}>
              <li>Pontos flexíveis</li>
              <li>Cashback automático</li>
              <li>Programas de fidelidade integrados</li>
            </ul>
          </div>
        </li>

        <li className={styles.step}>
          <div className={styles.stepHeader}>
            <div className={styles.displayFlex}>
              <div className={styles.stepNumber}>3</div>
              <Award size={48} className={styles.stepIcon} />
            </div>            
          </div>
          <div className={styles.stepContent}>
            <h3>Resgate seus prêmios</h3>
            <p>Troque seus pontos quando e como quiser</p>
            <ul className={styles.stepBenefits}>
              <li>Produtos exclusivos</li>
              <li>Descontos progressivos</li>
              <li>Experiências premium</li>
            </ul>
          </div>
        </li>
      </ol>
      </div>
      
    </section>   
    





    <RewardsSection />












      <section className={styles.sectionTwo}>

      {/* Benefícios integrados */}
      <motion.div 
        className={styles.features}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <div className={styles.featuresHeader}>
          <h3>Vantagens Clubily</h3>
          <p>Um ecossistema completo pensado para maximizar seus benefícios</p>
        </div>

        <div className={styles.grid}>
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className={styles.card}
              variants={featureVariants}
              whileHover="hover"
            >
              <div className={styles.iconContainer}>
                <feature.icon size={28} className={styles.icon} />
              </div>
              <h4>{feature.title}</h4>
              <p>{feature.text}</p>
              {feature.badge && (
                <span className={styles.badge}>{feature.badge}</span>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
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
                <div key={i} className={styles.benefitCardreferral}>
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
            <Image src="/affiliate-code.png" alt="Painel de indicações" fill sizes="(max-width: 768px) 80vw, 40vw" />
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
        </div>
      </section>
    </main>
  );
}
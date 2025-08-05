// app/cashback/page.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  DollarSign,
  Settings,
  Calendar,
  Zap,
  BarChart,
  Users,
  CheckCircle,
  Award,
  TrendingUp,
  ShoppingCart,
  MessageCircle,
  Shield,
  Lock,
  Calculator
} from 'lucide-react';
import { useState } from 'react';
import styles from './page.module.css';

export default function CashbackPage() {
  const faqs = [
    {
      q: 'Como defino o percentual de cashback?',
      a: 'Você pode escolher um valor fixo ou configurar regras avançadas por produto, categoria ou valor mínimo de compra.'
    },
    {
      q: 'Em quanto tempo o cliente recebe o crédito?',
      a: 'O cashback é creditado imediatamente após a compra, visível no painel do cliente em tempo real.'
    },
    {
      q: 'Posso limitar o uso por usuário?',
      a: 'Sim! Defina um máximo de usos por cliente ou um valor mínimo garantido a cada usuário.'
    }
  ];

  // --- Simulador simples ---
  const [ticketMedio, setTicketMedio] = useState(100);
  const [percentual, setPercentual] = useState(10);
  const [comprasMes, setComprasMes] = useState(50);
  const cashbackTotal = +(ticketMedio * (percentual / 100) * comprasMes).toFixed(2);
  const custoCreditos = +(comprasMes * 0.1).toFixed(2); // R$0,10 por ação

  return (
    <main className={styles.container}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Cashback Inteligente</h1>
          <p className={styles.heroSubtitle}>
            Defina percentuais personalizados e veja seus clientes acumularem créditos em tempo real.<br />
            Simples, transparente e sem complicações.
          </p>
          <Link href="#how-it-works" className={styles.primaryBtn}>
            Como Funciona
          </Link>
        </div>
        <div className={styles.heroImage}>
          <Image
            src="/dashboard.png"
            alt="Dashboard de cashback"
            width={400}
            height={450}
            className={styles.image}
          />
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Como Funciona</h2>
          <p>Em 4 passos você configura e monitora seu programa de cashback:</p>
        </div>
        <div className={styles.steps}>
          <div className={styles.stepCard}>
            <Settings size={48} className={styles.stepIcon} />
            <h3>1. Configure Regras</h3>
            <p>Escolha percentuais fixos, variáveis ou condições avançadas.</p>
          </div>
          <div className={styles.stepCard}>
            <CheckCircle size={48} className={styles.stepIcon} />
            <h3>2. Ative o Programa</h3>
            <p>Defina validade, status e visibilidade em apenas um clique.</p>
          </div>
          <div className={styles.stepCard}>
            <Zap size={48} className={styles.stepIcon} />
            <h3>3. Atribua Benefícios</h3>
            <p>O sistema converte automaticamente percentuais em créditos.</p>
          </div>
          <div className={styles.stepCard}>
            <BarChart size={48} className={styles.stepIcon} />
            <h3>4. Analise Resultados</h3>
            <p>Dashboards completos com métricas de uso e ROI.</p>
          </div>
        </div>
      </section>

      {/* O que você configura (mapeado ao modal de criação) */}
      <section className={styles.configSection}>
        <div className={styles.sectionHeaderTwo}>
          <h2>O que você configura</h2>
          <p>Os mesmos campos do modal de criação — com controle total:</p>
        </div>
        <div className={styles.configGrid}>
          <div className={styles.configItem}>
            <Settings />
            <div>
              <strong>Nome & Descrição</strong>
              <p>Identifique o programa e explique suas regras aos clientes.</p>
            </div>
          </div>
          <div className={styles.configItem}>
            <DollarSign />
            <div>
              <strong>Percentual</strong>
              <p>Defina de 0% a 100% com arredondamento preciso por compra.</p>
            </div>
          </div>
          <div className={styles.configItem}>
            <Calendar />
            <div>
              <strong>Validade (dias)</strong>
              <p>Expiração automática para incentivar o resgate rápido.</p>
            </div>
          </div>
          <div className={styles.configItem}>
            <CheckCircle />
            <div>
              <strong>Status & Visibilidade</strong>
              <p>Ative/oculte quando quiser, sem perder o histórico.</p>
            </div>
          </div>
          <div className={styles.configItem}>
            <Users />
            <div>
              <strong>Limites por usuário</strong>
              <p>Máximo de usos ou cashback mínimo garantido por cliente.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className={styles.features}>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><DollarSign size={32} /></div>
            <h3>Percentuais Flexíveis</h3>
            <p>Regras por produto, categoria ou valor total de compra.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><Users size={32} /></div>
            <h3>Limites e Restrições</h3>
            <p>Controle máximo por usuário e requisitos mínimos.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><Calendar size={32} /></div>
            <h3>Validade Controlada</h3>
            <p>Defina prazos de expiração para incentivar o uso rápido.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><BarChart size={32} /></div>
            <h3>Indicadores em Tempo Real</h3>
            <p>Monitore uso, valor resgatado e usuários ativos.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><TrendingUp size={32} /></div>
            <h3>Impulsione Vendas</h3>
            <p>Aumente o ticket médio e a recorrência de compra.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><Award size={32} /></div>
            <h3>Fidelização</h3>
            <p>Clientes retornam mais vezes, fortalecendo sua marca.</p>
          </div>
        </div>
      </section>

      {/* Custos em Créditos */}
      <section className={styles.creditsSection}>
        <div className={styles.sectionHeader}>
          <h2>Custos em Créditos</h2>
          <p>Transparente e previsível: <strong>R$ 0,10</strong> por atribuição de cashback.</p>
        </div>
        <ul className={styles.creditsList}>
          <li>Sem mensalidade obrigatória</li>
          <li>Pague somente pelo que usar</li>
          <li>Recarregue quando precisar</li>
        </ul>
      </section>

      {/* Metrics & Benefits */}
      <section className={styles.metrics}>
        <h2>Resultados Comprovados</h2>
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div><ShoppingCart size={40} /></div>
            <strong>+25%</strong>
            <span>Aumento de vendas médias</span>
          </div>
          <div className={styles.metricCard}>
            <div><TrendingUp size={40} /></div>
            <strong>+40%</strong>
            <span>Crescimento no ticket médio</span>
          </div>
          <div className={styles.metricCard}>
            <div><Users size={40} /></div>
            <strong>+60%</strong>
            <span>Retenção de clientes</span>
          </div>
        </div>
      </section>

      {/* Simulador */}
      <section className={styles.simulator}>
        <div className={styles.sectionHeaderTwo}>
          <h2><Calculator className={styles.inlineIcon} /> Simule seu impacto</h2>
          <p>Estimativa rápida de cashback distribuído e custo em créditos.</p>
        </div>
        <div className={styles.simGrid}>
          <div className={styles.simForm}>
            <label>
              Ticket médio (R$)
              <input type="number" min={0} value={ticketMedio} onChange={e => setTicketMedio(Number(e.target.value))} />
            </label>
            <label>
              Percentual (%)
              <input type="number" min={0} max={100} value={percentual} onChange={e => setPercentual(Number(e.target.value))} />
            </label>
            <label>
              Compras/mês
              <input type="number" min={0} value={comprasMes} onChange={e => setComprasMes(Number(e.target.value))} />
            </label>
          </div>
          <div className={styles.simResult}>
            <div className={styles.resultCard}>
              <h3>Total de cashback no mês</h3>
              <strong>R$ {cashbackTotal.toFixed(2)}</strong>
              <span className={styles.resultHint}>Baseado nos parâmetros acima</span>
            </div>
            <div className={styles.resultCard}>
              <h3>Custo em créditos</h3>
              <strong>R$ {custoCreditos.toFixed(2)}</strong>
              <span className={styles.resultHint}>R$ 0,10 por atribuição</span>
            </div>
          </div>
        </div>
      </section>

      {/* Segurança & LGPD */}
      <section className={styles.security}>
        <div className={styles.sectionHeader}>
          <h2>Segurança & LGPD</h2>
          <p>Privacidade em primeiro lugar: dados criptografados e controles de acesso.</p>
        </div>
        <div className={styles.securityGrid}>
          <div className={styles.securityItem}>
            <Shield />
            <span>Criptografia em trânsito e em repouso</span>
          </div>
          <div className={styles.securityItem}>
            <Lock />
            <span>Controles de acesso por papel</span>
          </div>
          <div className={styles.securityItem}>
            <MessageCircle />
            <span>Exportação/eliminação de dados sob demanda</span>
          </div>
        </div>
      </section>

      {/* Casos de uso por segmento */}
      <section className={styles.useCases}>
        <div className={styles.sectionHeader}>
          <h2>Casos de Uso</h2>
          <p>Estratégias que funcionam em diferentes nichos:</p>
        </div>
        <div className={styles.useCaseGrid}>
          <div className={styles.useCaseCard}>
            <h3>Food Service</h3>
            <p>5% em dias de baixo movimento para aumentar fluxo.</p>
          </div>
          <div className={styles.useCaseCard}>
            <h3>Moda & Acessórios</h3>
            <p>10% para compras acima de R$ 200 com validade de 30 dias.</p>
          </div>
          <div className={styles.useCaseCard}>
            <h3>Beleza & Saúde</h3>
            <p>Cashback cumulativo para pacotes e recorrência.</p>
          </div>
          <div className={styles.useCaseCard}>
            <h3>Mercado Local</h3>
            <p>Campanhas sazonais com limite por CPF.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={styles.faqs}>
        <h2>Perguntas Frequentes</h2>
        {faqs.map((item, idx) => (
          <details key={idx} className={styles.faqItem}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </section>

      {/* Call to Action */}
      <section className={styles.ctaSection}>
        <h2>Pronto para transformar seu negócio?</h2>
        <Link href="/programs/cashback/new" className={styles.ctaBtn}>
          Criar Programa Agora
        </Link>
      </section>
    </main>
  );
}

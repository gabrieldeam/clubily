// app/points/page.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Star,
  Settings,
  Zap,
  BarChart,
  Users,
  CheckCircle,
  Award,
  TrendingUp,
  ShoppingCart,
  Shield,
  Lock,
  Calculator,
  Layers,
  MapPin,
  Package,
  Tag,
  Link2,
  Wallet
} from 'lucide-react';
import { useState } from 'react';
import styles from './page.module.css';

export default function PointsPage() {
  const faqs = [
    {
      q: 'Como os pontos são calculados?',
      a: 'Você define regras. Ex.: a cada R$ 10 em compras (step), o cliente ganha 1 ponto (points). Também é possível usar multiplicadores por categoria/itens.'
    },
    {
      q: 'Preciso comprar os pontos antes?',
      a: 'Sim. A atribuição de pontos depende do saldo pré-pago da sua empresa. Você pode comprar pontos avulsos ou aderir a um dos nossos planos (com benefícios).'
    },
    {
      q: 'Posso limitar quantas vezes um cliente pontua?',
      a: 'Sim. Em “Comportamento Digital”, por exemplo, há limite de uso por usuário e validade (início e fim).'
    },
    {
      q: 'Quando os pontos aparecem para o cliente?',
      a: 'Imediatamente após a transação ou evento, no painel do cliente em tempo real.'
    }
  ];

  // --- Simulador (baseado em value_spent; sem preço, só consumo de pontos) ---
  const [ticketMedio, setTicketMedio] = useState(100);
  const [comprasMes, setComprasMes] = useState(50);
  const [stepReais, setStepReais] = useState(10);        // R$ por passo
  const [pontosPorPasso, setPontosPorPasso] = useState(1); // pontos por passo
  const margemSeguranca = 0.15; // 15% de colchão

  const passosPorCompra = stepReais > 0 ? Math.floor(ticketMedio / stepReais) : 0;
  const pontosPorCompra = passosPorCompra * pontosPorPasso;
  const pontosMes = pontosPorCompra * comprasMes;
  const saldoRecomendado = Math.ceil(pontosMes * (1 + margemSeguranca));

  return (
    <main className={styles.container}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Programa de Pontos</h1>
          <p className={styles.heroSubtitle}>
            Compre pontos, defina regras e recompense seus clientes com recorrência.
            <br />
            Regras flexíveis, visibilidade em tempo real.
          </p>
          <Link href="#how-it-works" className={styles.primaryBtn}>
            Como Funciona
          </Link>
        </div>
        <div className={styles.heroImage}>
          <Image
            src="/dashboard.png"
            alt="Dashboard de pontos"
            width={400}
            height={450}
            className={styles.image}
          />
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Como Funciona</h2>
          <p>Em 4 passos você configura e monitora seu programa de pontos:</p>
        </div>
        <div className={styles.steps}>
          <div className={styles.stepCard}>
            <Settings size={48} className={styles.stepIcon} />
            <h3>1. Configure Regras</h3>
            <p>Defina “R$ por passo” e “Pontos por passo”, eventos e multiplicadores.</p>
          </div>
          <div className={styles.stepCard}>
            <CheckCircle size={48} className={styles.stepIcon} />
            <h3>2. Garanta Saldo</h3>
            <p>Compre pontos (avulso ou planos) para que as atribuições sejam possíveis.</p>
          </div>
          <div className={styles.stepCard}>
            <Zap size={48} className={styles.stepIcon} />
            <h3>3. Pontue Clientes</h3>
            <p>Pontuação automática por compra, item, categoria, filial ou link.</p>
          </div>
          <div className={styles.stepCard}>
            <BarChart size={48} className={styles.stepIcon} />
            <h3>4. Acompanhe</h3>
            <p>Métricas de uso, usuários únicos e médias por operação.</p>
          </div>
        </div>
      </section>

      {/* O que você configura */}
      <section className={styles.configSection}>
        <div className={styles.sectionHeaderTwo}>
          <h2>O que você configura</h2>
          <p>Campos espelhados do modal de criação/edição de regras:</p>
        </div>

        <div className={styles.configGrid}>
          <div className={styles.configItem}>
            <Settings />
            <div>
              <strong>Nome & Descrição</strong>
              <p>Identifique a regra e explique como pontuar.</p>
            </div>
          </div>

          <div className={styles.configItem}>
            <Star />
            <div>
              <strong>Tipo de Regra</strong>
              <p>Value Spent, Categoria, Inventário, Geolocalização, Comportamento Digital, etc.</p>
            </div>
          </div>

          <div className={styles.configItem}>
            <Layers />
            <div>
              <strong>Value Spent</strong>
              <p>“R$ por passo” e “Pontos por passo” para converter valor em pontos.</p>
            </div>
          </div>

          <div className={styles.configItem}>
            <Tag />
            <div>
              <strong>Categoria (multiplicador)</strong>
              <p>Selecione categorias e aplique multiplicador de pontos.</p>
            </div>
          </div>

          <div className={styles.configItem}>
            <Package />
            <div>
              <strong>Inventário (multiplicador)</strong>
              <p>Selecione itens e defina multiplicador para impulsionar produtos-chave.</p>
            </div>
          </div>

          <div className={styles.configItem}>
            <MapPin />
            <div>
              <strong>Geolocalização</strong>
              <p>Escolha a filial e a quantidade de pontos ao comprar/presencial.</p>
            </div>
          </div>

          <div className={styles.configItem}>
            <Link2 />
            <div>
              <strong>Comportamento Digital</strong>
              <p>Slug único, validade (início/fim), pontos e máximo de usos por usuário.</p>
            </div>
          </div>

          <div className={styles.configItem}>
            <Wallet />
            <div>
              <strong>Saldo de Pontos</strong>
              <p>Atribuições só ocorrem se houver saldo suficiente na conta da empresa.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><Star size={32} /></div>
            <h3>Regras Claras</h3>
            <p>Converta valor gasto em pontos, sem complicação.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><Users size={32} /></div>
            <h3>Engajamento</h3>
            <p>Clientes acumulam e voltam para resgatar recompensas.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><Layers size={32} /></div>
            <h3>Multiplicadores</h3>
            <p>Impulsione categorias e itens estratégicos.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><BarChart size={32} /></div>
            <h3>Métricas em Tempo Real</h3>
            <p>Transações, usuários únicos e médias por operação.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><TrendingUp size={32} /></div>
            <h3>Mais Recorrência</h3>
            <p>Frequência de compra e ticket médio tendem a subir.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><Award size={32} /></div>
            <h3>Fidelização</h3>
            <p>Recompensas claras aumentam a lealdade à marca.</p>
          </div>
        </div>
      </section>

      {/* Aquisição de Pontos (menciona planos, sem detalhar) */}
      <section className={styles.creditsSection}>
        <div className={styles.sectionHeader}>
          <h2>Aquisição de Pontos</h2>
          <p>
            As empresas compram pontos para distribuir aos clientes. Você pode
            comprar pontos avulsos ou aderir a <strong>planos</strong> com benefícios de volume.
          </p>
        </div>
        <ul className={styles.creditsList}>
          <li>Saldo pré-pago para atribuição de pontos</li>
          <li>Compra avulsa e planos de volume (sem fidelidade obrigatória)</li>
          <li>Acompanhamento de saldo e consumo em tempo real</li>
        </ul>
      </section>

      {/* Métricas & Benefícios (exemplos ilustrativos) */}
      <section className={styles.metrics}>
        <h2>Resultados Esperados</h2>
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div><ShoppingCart size={40} /></div>
            <strong>+20%</strong>
            <span>Frequência de compra</span>
          </div>
          <div className={styles.metricCard}>
            <div><TrendingUp size={40} /></div>
            <strong>+15%</strong>
            <span>Ticket médio</span>
          </div>
          <div className={styles.metricCard}>
            <div><Users size={40} /></div>
            <strong>+35%</strong>
            <span>Retenção de clientes</span>
          </div>
        </div>
      </section>

      {/* Simulador (sem preço: foco em pontos necessários e saldo recomendado) */}
      <section className={styles.simulator}>
        <div className={styles.sectionHeaderTwo}>
          <h2><Calculator className={styles.inlineIcon} /> Estime seu consumo</h2>
          <p>Veja quantos pontos você deve ter em saldo para manter a operação estável.</p>
        </div>
        <div className={styles.simGrid}>
          <div className={styles.simForm}>
            <label>
              Ticket médio (R$)
              <input
                type="number"
                min={0}
                value={ticketMedio}
                onChange={e => setTicketMedio(Number(e.target.value))}
              />
            </label>
            <label>
              Compras/mês
              <input
                type="number"
                min={0}
                value={comprasMes}
                onChange={e => setComprasMes(Number(e.target.value))}
              />
            </label>
            <label>
              R$ por passo
              <input
                type="number"
                min={0}
                value={stepReais}
                onChange={e => setStepReais(Number(e.target.value))}
              />
            </label>
            <label>
              Pontos por passo
              <input
                type="number"
                min={0}
                value={pontosPorPasso}
                onChange={e => setPontosPorPasso(Number(e.target.value))}
              />
            </label>
          </div>

          <div className={styles.simResult}>
            <div className={styles.resultCard}>
              <h3>Pontos estimados/mês</h3>
              <strong>{pontosMes.toLocaleString('pt-BR')} pts</strong>
              <span className={styles.resultHint}>
                {passosPorCompra} passos/compra × {pontosPorPasso} pts
              </span>
            </div>
            <div className={styles.resultCard}>
              <h3>Saldo recomendado</h3>
              <strong>{saldoRecomendado.toLocaleString('pt-BR')} pts</strong>
              <span className={styles.resultHint}>
                Inclui margem de {Math.round(margemSeguranca * 100)}% para picos
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Segurança & LGPD */}
      <section className={styles.security}>
        <div className={styles.sectionHeader}>
          <h2>Segurança & LGPD</h2>
          <p>Criptografia, controle de acesso e portabilidade de dados.</p>
        </div>
        <div className={styles.securityGrid}>
          <div className={styles.securityItem}>
            <Shield />
            <span>Criptografia em trânsito e em repouso</span>
          </div>
          <div className={styles.securityItem}>
            <Lock />
            <span>Perfis e papéis com permissões</span>
          </div>
          <div className={styles.securityItem}>
            <span>Exportação/eliminação sob demanda</span>
          </div>
        </div>
      </section>

      {/* Casos de uso */}
      <section className={styles.useCases}>
        <div className={styles.sectionHeader}>
          <h2>Casos de Uso</h2>
          <p>Estrategicamente simples, eficaz em vários nichos:</p>
        </div>
        <div className={styles.useCaseGrid}>
          <div className={styles.useCaseCard}>
            <h3>Food Service</h3>
            <p>1 ponto a cada R$ 10; 2× pontos em dias de baixo fluxo.</p>
          </div>
          <div className={styles.useCaseCard}>
            <h3>Moda & Acessórios</h3>
            <p>Multiplicador 1.5× para categorias selecionadas.</p>
          </div>
          <div className={styles.useCaseCard}>
            <h3>Beleza & Saúde</h3>
            <p>Pontos fixos por pacote e bônus por recorrência.</p>
          </div>
          <div className={styles.useCaseCard}>
            <h3>Mercado Local</h3>
            <p>Link (slug) para campanhas digitais com validade.</p>
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

      {/* CTA */}
      <section className={styles.ctaSection}>
        <h2>Pronto para começar?</h2>
        <Link href="/programs/rules" className={styles.ctaBtn}>
          Criar Regra Agora
        </Link>
      </section>
    </main>
  );
}

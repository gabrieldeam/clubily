// app/loyalty/page.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Settings,
  CheckCircle,
  Gift,
  Award,
  Users,
  BarChart,
  Zap,
  TrendingUp,
  Calendar,
  ShoppingCart,
  Shield,
  Lock,
  Calculator,
  Package,
  Tag,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import styles from './page.module.css';

export default function LoyaltyPage() {
  const faqs = [
    {
      q: 'Como funciona o cartão fidelidade?',
      a: 'Você cria um template com total de carimbos, cores e limites. Define regras de carimbo (por valor, visita, produto, categoria, etc.). Ao completar os carimbos, o cliente ganha a(s) recompensa(s) configurada(s).',
    },
    {
      q: 'Posso ter mais de uma recompensa?',
      a: 'Sim. Você pode associar recompensas a carimbos específicos (ex.: no 5º carimbo um bônus, no 10º a recompensa principal).',
    },
    {
      q: 'Existe validade ou limite de emissões?',
      a: 'Sim. No template você define janela de emissão (início/fim), limite total de emissões e limite por usuário.',
    },
  ];

  // --- Simulador ---
  // Premissas: 1) cada compra/visita elegível concede 1 carimbo
  //            2) taxa de elegibilidade = % de compras que atendem à(s) regra(s)
  //            3) recompensa principal ao completar o cartão (stampTotal)
  const [clientesMes, setClientesMes] = useState(500);
  const [visitasMedia, setVisitasMedia] = useState(2); // por cliente/mês
  const [taxaElegibilidade, setTaxaElegibilidade] = useState(70); // %
  const [stampTotal, setStampTotal] = useState(10);
  const [taxaResgate, setTaxaResgate] = useState(80); // % dos completos que resgatam

  const carimbosMes = useMemo(() => {
    const elegiveis = (visitasMedia * clientesMes) * (taxaElegibilidade / 100);
    return Math.floor(elegiveis);
  }, [clientesMes, visitasMedia, taxaElegibilidade]);

  const cartoesCompletosMes = useMemo(() => {
    if (stampTotal <= 0) return 0;
    return Math.floor(carimbosMes / stampTotal);
  }, [carimbosMes, stampTotal]);

  const recompensasNecessariasMes = useMemo(() => {
    return Math.floor(cartoesCompletosMes * (taxaResgate / 100));
  }, [cartoesCompletosMes, taxaResgate]);

  // tempo médio (em meses) para um cliente completar 1 cartão
  const mesesParaCompletar = useMemo(() => {
    const carimbosPorClienteMes = visitasMedia * (taxaElegibilidade / 100);
    if (carimbosPorClienteMes <= 0) return Infinity;
    return +(stampTotal / carimbosPorClienteMes).toFixed(1);
  }, [visitasMedia, taxaElegibilidade, stampTotal]);

  return (
    <main className={styles.container}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Cartão Fidelidade (Carimbos)</h1>
          <p className={styles.heroSubtitle}>
            Crie cartões de carimbos, defina regras de concessão e associe recompensas.
            Visualize a evolução dos clientes e acompanhe resgates em tempo real.
          </p>
          <Link href="#how-it-works" className={styles.primaryBtn}>
            Como Funciona
          </Link>
        </div>
        <div className={styles.heroImage}>
          <Image
            src="/dashboard.png"
            alt="Dashboard de cartão fidelidade"
            width={400}
            height={450}
            className={styles.image}
          />
        </div>
      </section>

      {/* Como funciona */}
      <section id="how-it-works" className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Como Funciona</h2>
          <p>O fluxo reflete seus modais de Template, Regras e Recompensas:</p>
        </div>
        <div className={styles.steps}>
          <div className={styles.stepCard}>
            <Settings size={48} className={styles.stepIcon} />
            <h3>1. Template</h3>
            <p>Defina título, total de carimbos, cores, limites e janela de emissão.</p>
          </div>
          <div className={styles.stepCard}>
            <CheckCircle size={48} className={styles.stepIcon} />
            <h3>2. Regras</h3>
            <p>Conceda carimbos por valor, visita, produto, categoria ou evento.</p>
          </div>
          <div className={styles.stepCard}>
            <Gift size={48} className={styles.stepIcon} />
            <h3>3. Recompensas</h3>
            <p>Associe prêmios ao carimbo <em>N</em> (ex.: no 10º, recompensa principal).</p>
          </div>
          <div className={styles.stepCard}>
            <BarChart size={48} className={styles.stepIcon} />
            <h3>4. Acompanhe</h3>
            <p>Emita cartões, monitore evolução, resgates e validade.</p>
          </div>
        </div>
      </section>

      {/* O que você configura (mapeado aos seus modais/serviços) */}
      <section className={styles.configSection}>
        <div className={styles.sectionHeaderTwo}>
          <h2>O que você configura</h2>
          <p>Campos espelhados dos seus componentes e serviços atuais:</p>
        </div>

        <div className={styles.configGrid}>
          {/* Template */}
          <div className={styles.configItem}>
            <Settings />
            <div>
              <strong>Template do Cartão</strong>
              <p>
                Título, texto promocional, <b>stamp_total</b>, cores, <b>per_user_limit</b>,
                <b> emission_start/end</b>, <b>emission_limit</b> e status.
              </p>
            </div>
          </div>

          {/* Regras */}
          <div className={styles.configItem}>
            <Tag />
            <div>
              <strong>Regras de Carimbo</strong>
              <p>
                <b>purchase_amount</b> (mínimo em R$), <b>visit</b> (a cada N visitas),
                <b> product_bought</b> (itens específicos),
                <b> category_bought</b> (categorias), ou <b>custom_event</b>.
              </p>
            </div>
          </div>

          {/* Itens/Categorias */}
          <div className={styles.configItem}>
            <Package />
            <div>
              <strong>Produtos & Categorias</strong>
              <p>
                Multi-seleção com paginação, exatamente como no seu modal (checkbox list).
              </p>
            </div>
          </div>

          {/* Recompensas */}
          <div className={styles.configItem}>
            <Gift />
            <div>
              <strong>Recompensas por Carimbo</strong>
              <p>
                Vincule recompensas ao <b>stamp_no</b> (ex.: 5º carimbo = bônus; 10º = prêmio principal).
              </p>
            </div>
          </div>

          {/* Emissão & Instâncias */}
          <div className={styles.configItem}>
            <Calendar />
            <div>
              <strong>Emissão & Instâncias</strong>
              <p>
                Emissão dentro da janela; instâncias listadas com filtros de status, “faltando ≤” e “expira em ≤ dias”.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className={styles.features}>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><Users size={32} /></div>
            <h3>Mais recorrência</h3>
            <p>Metas visuais (carimbos) incentivam retorno.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><Award size={32} /></div>
            <h3>Recompensas claras</h3>
            <p>O cliente sabe exatamente o que precisa para ganhar.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><Zap size={32} /></div>
            <h3>Regras flexíveis</h3>
            <p>Configure por valor, visitas, itens e categorias.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><BarChart size={32} /></div>
            <h3>Medição</h3>
            <p>Instâncias, evolução, resgates e validade — em tempo real.</p>
          </div>
        </div>
      </section>

      {/* Métricas esperadas (exemplos ilustrativos) */}
      <section className={styles.metrics}>
        <h2>Resultados Esperados</h2>
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div><ShoppingCart size={40} /></div>
            <strong>+18%</strong>
            <span>Frequência de compra</span>
          </div>
          <div className={styles.metricCard}>
            <div><TrendingUp size={40} /></div>
            <strong>+12%</strong>
            <span>Ticket médio</span>
          </div>
          <div className={styles.metricCard}>
            <div><Users size={40} /></div>
            <strong>+30%</strong>
            <span>Retenção de clientes</span>
          </div>
        </div>
      </section>

      {/* Simulador */}
      <section className={styles.simulator}>
        <div className={styles.sectionHeaderTwo}>
          <h2><Calculator className={styles.inlineIcon} /> Simule seu cartão</h2>
          <p>Estimativa de carimbos mensais, cartões completos e recompensas necessárias.</p>
        </div>

        <div className={styles.simGrid}>
          <div className={styles.simForm}>
            <label>Clientes/mês
              <input type="number" min={0} value={clientesMes} onChange={e => setClientesMes(+e.target.value)} />
            </label>
            <label>Visitas médias por cliente/mês
              <input type="number" min={0} step="0.1" value={visitasMedia} onChange={e => setVisitasMedia(+e.target.value)} />
            </label>
            <label>% de compras elegíveis
              <input type="number" min={0} max={100} value={taxaElegibilidade} onChange={e => setTaxaElegibilidade(+e.target.value)} />
            </label>
            <label>Total de carimbos no cartão
              <input type="number" min={1} value={stampTotal} onChange={e => setStampTotal(+e.target.value)} />
            </label>
            <label>% de resgate (entre completos)
              <input type="number" min={0} max={100} value={taxaResgate} onChange={e => setTaxaResgate(+e.target.value)} />
            </label>
          </div>

          <div className={styles.simResult}>
            <div className={styles.resultCard}>
              <h3>Carimbos/mês</h3>
              <strong>{carimbosMes.toLocaleString('pt-BR')}</strong>
              <span className={styles.resultHint}>Clientes × Visitas × % elegíveis</span>
            </div>
            <div className={styles.resultCard}>
              <h3>Cartões completos/mês</h3>
              <strong>{cartoesCompletosMes.toLocaleString('pt-BR')}</strong>
              <span className={styles.resultHint}>≈ Carimbos ÷ {stampTotal}</span>
            </div>
            <div className={styles.resultCard}>
              <h3>Recompensas necessárias/mês</h3>
              <strong>{recompensasNecessariasMes.toLocaleString('pt-BR')}</strong>
              <span className={styles.resultHint}>Completos × % de resgate</span>
            </div>
            <div className={styles.resultCard}>
              <h3>Tempo médio p/ concluir</h3>
              <strong>
                {mesesParaCompletar === Infinity ? '—' : `${mesesParaCompletar} mês(es)`}
              </strong>
              <span className={styles.resultHint}>Estimativa por cliente</span>
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
          <div className={styles.securityItem}><Shield /><span>Criptografia em trânsito e em repouso</span></div>
          <div className={styles.securityItem}><Lock /><span>Acessos por papel e auditoria</span></div>
        </div>
      </section>

      {/* Casos de uso */}
      <section className={styles.useCases}>
        <div className={styles.sectionHeaderTwo}>
          <h2>Casos de Uso</h2>
          <p>Estratégias de carimbo que funcionam em diferentes nichos:</p>
        </div>
        <div className={styles.useCaseGrid}>
          <div className={styles.useCaseCard}>
            <h3>Food Service</h3>
            <p>1 carimbo por visita ≥ R$ X; bônus no 5º; principal no 10º.</p>
          </div>
          <div className={styles.useCaseCard}>
            <h3>Moda & Acessórios</h3>
            <p>Carimbo em categorias selecionadas; brinde ao completar.</p>
          </div>
          <div className={styles.useCaseCard}>
            <h3>Beleza & Saúde</h3>
            <p>Carimbo por sessão; pacote concluído rende upgrade.</p>
          </div>
          <div className={styles.useCaseCard}>
            <h3>Mercado Local</h3>
            <p>Carimbo por visita; prêmio sazonal com validade.</p>
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
        <h2>Pronto para criar seu cartão?</h2>
        <Link href="/programs/templates" className={styles.ctaBtn}>
          Criar Cartão Agora
        </Link>
      </section>
    </main>
  );
}

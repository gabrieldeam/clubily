import { DollarSign, Gift, Star, CreditCard, Stamp, BarChart, Settings, Zap, CheckCircle, ShoppingBag, Calendar, Users } from 'lucide-react';
import styles from './page.module.css';
import Image from 'next/image';

export const metadata = { title: 'Clubily para Empresas' };

export default function Companies() {
  return (
    <main className={styles.container}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Fidelização inteligente que impulsiona suas vendas</h1>
          <p className={styles.heroSubtitle}>
            Crie programas de cashback, pontos e cartão fidelidade personalizados, compre créditos e transforme clientes em fãs fiéis.
          </p>
          <div className={styles.ctaButtons}>
            <a href="#start" className={styles.primaryBtn}>Começar agora</a>
            <a href="#how-it-works" className={styles.secondaryBtn}>Ver demonstração</a>
          </div>
        </div>
        <div className={styles.heroImage}>
          <div className={styles.rightPanel}>
          <Image
            src="/moedagb.svg"
            alt="Moeda GB"
            width={450}   
            height={450}
            priority
          />
        </div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="how-it-works" className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Como funciona a Clubily</h2>
          <p className={styles.sectionDescription}>Um sistema completo em 4 passos simples</p>
        </div>
        
        <div className={styles.steps}>
          <div className={styles.stepCard}>
            <div className={styles.displayFlex}>
              <div className={styles.stepNumber}>1</div>
              <Settings size={48} className={styles.stepIcon} />
            </div>
            <h3 className={styles.stepTitle}>Configure seus programas</h3>
            <p className={styles.stepDescription}>Crie programas de cashback, pontos ou cartão fidelidade com regras personalizadas</p>
          </div>
          
          <div className={styles.stepCard}>
            <div className={styles.displayFlex}>
            <div className={styles.stepNumber}>2</div>
            <ShoppingBag size={48} className={styles.stepIcon} />
            </div>
            <h3 className={styles.stepTitle}>Adquira créditos</h3>
            <p className={styles.stepDescription}>Compre pacotes de créditos para usar nos seus programas de fidelidade</p>
          </div>
          
          <div className={styles.stepCard}>
            <div className={styles.displayFlex}>
            <div className={styles.stepNumber}>3</div>
            <Zap size={48} className={styles.stepIcon} />
            </div>
            <h3 className={styles.stepTitle}>Atribua benefícios</h3>
            <p className={styles.stepDescription}>Os créditos são automaticamente convertidos em cashback, pontos ou carimbos</p>
          </div>
          
          <div className={styles.stepCard}>
            <div className={styles.displayFlex}>
            <div className={styles.stepNumber}>4</div>
            <BarChart size={48} className={styles.stepIcon} />
            </div>
            <h3 className={styles.stepTitle}>Analise resultados</h3>
            <p className={styles.stepDescription}>Acompanhe o desempenho de cada programa e o retorno sobre investimento</p>
          </div>
        </div>
      </section>

{/* Sistema de Créditos */}
<section className={`${styles.section} ${styles.creditSection}`}>
  <div className={styles.creditContainer}>
    <div className={styles.creditContent}>
      <h2 className={styles.sectionTitle}>Sistema transparente de créditos</h2>
      <p className={styles.creditDescription}>
        Compre créditos uma única vez e pague apenas pelo que usar. Cada ação de fidelização custa <strong>R$0,10</strong> em créditos, independentemente do tipo de benefício.
      </p>     
      
      
      <div className={styles.creditFeatures}>
        <div className={styles.creditFeature}>
          <CheckCircle className={styles.featureIcon} />
          <span>Sem custo fixo mensal</span>
        </div>
        <div className={styles.creditFeature}>
          <CheckCircle className={styles.featureIcon} />
          <span>Pague apenas pelo que usar</span>
        </div>
        <div className={styles.creditFeature}>
          <CheckCircle className={styles.featureIcon} />
          <span>Validade de 12 meses para os créditos</span>
        </div>
        <div className={styles.creditFeature}>
          <CheckCircle className={styles.featureIcon} />
          <span>Recarregue a qualquer momento</span>
        </div>
      </div>
      
      <div className={styles.creditExample}>
        <h3>Como funciona na prática</h3>
        <p>Você compra créditos (ex: R$100,00) e conforme seus clientes realizam ações:</p>
        <ul>
          <li>Cada cashback dado: <strong>- R$0,10</strong> em créditos</li>
          <li>Cada conjunto de pontos atribuído: <strong>- R$0,10</strong> em créditos</li>
          <li>Cada carimbo de fidelidade: <strong>- R$0,10</strong> em créditos</li>
        </ul>
        <p className={styles.note}>
          O valor do benefício em si (valor do cashback, quantidade de pontos, etc) é definido por você 
          e não afeta o custo em créditos - sempre R$0,10 por ação.
        </p>
      </div>
    </div>
    
    <div className={styles.creditImage}>
      <div className={styles.creditModel}>
        <div className={styles.creditModelCard}>
          <div className={styles.modelIcon}>
            <DollarSign size={32} />
          </div>
          <h3>Cashback</h3>
          <p>R$0,10 por cada cashback atribuído</p>
          <div className={styles.modelExample}>
            Exemplo: 100 cashbacks = R$10,00 em créditos
          </div>
        </div>
        
        <div className={styles.creditModelCard}>
          <div className={styles.modelIcon}>
            <Star size={32} />
          </div>
          <h3>Pontos</h3>
          <p>R$0,10 por cada atribuição de pontos</p>
          <div className={styles.modelExample}>
            Exemplo: 500 pontos distribuídos = R$0,50 em créditos
          </div>
        </div>
        
        <div className={styles.creditModelCard}>
          <div className={styles.modelIcon}>
            <Stamp size={32} />
          </div>
          <h3>Carimbos</h3>
          <p>R$0,10 por cada carimbo atribuído</p>
          <div className={styles.modelExample}>
            Exemplo: 50 carimbos = R$5,00 em créditos
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

      {/* Cashback */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.programIcon}>
            <DollarSign size={48} />
          </div>
          <h2 className={styles.sectionTitle}>Cashback Inteligente</h2>
          <p className={styles.sectionDescription}>Recompense clientes com devoluções personalizáveis</p>
        </div>
        
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>
              <Settings size={32} />
            </div>
            <h3>Configuração flexível</h3>
            <p>Defina percentuais fixos, variáveis por produto ou valor total da compra</p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>
              <Users size={32} />
            </div>
            <h3>Regras personalizadas</h3>
            <p>Limite por usuário, período ou valor máximo de cashback</p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>
              <Calendar size={32} />
            </div>
            <h3>Vencimento controlado</h3>
            <p>Estabeleça prazos de validade para o cashback acumulado</p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>
              <Zap size={32} />
            </div>
            <h3>Resgate instantâneo</h3>
            <p>Seus clientes podem usar o saldo a qualquer momento</p>
          </div>
        </div>
        
        <div className={styles.programExample}>
          <h3>Exemplo de uso:</h3>
          <p>
            Para clientes VIP, ofereça 10% de cashback em compras acima de R$200, 
            com limite de R$50 por mês. O saldo expira em 60 dias.
          </p>
        </div>
      </section>

      {/* Pontos */}
      <section className={`${styles.section} ${styles.pointsSection}`}>
        <div className={styles.sectionHeader}>
          <div className={styles.programIcon}>
            <Star size={48} />
          </div>
          <h2 className={styles.sectionTitle}>Programa de Pontos</h2>
          <p className={styles.sectionDescription}>Incentive comportamentos e engaje clientes</p>
        </div>
        
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>
              <Settings size={32} />
            </div>
            <h3>Regras avançadas</h3>
            <p>Pontos por primeira compra, frequência, valor gasto ou ações específicas</p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>
              <Gift size={32} />
            </div>
            <h3>Lojinha integrada</h3>
            <p>Clientes trocam pontos por produtos e serviços na Clubily Lojinha</p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>
              <Zap size={32} />
            </div>
            <h3>Pontos por ações externas</h3>
            <p>Crie links para distribuir pontos por ações fora da plataforma</p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>
              <BarChart size={32} />
            </div>
            <h3>Controle total</h3>
            <p>Compre e distribuia os pontos para seus clientes, de acordo com a demanda</p>
          </div>
        </div>
        
        <div className={styles.programExample}>
          <h3>Exemplo de uso:</h3>
          <p>
            Dê 500 pontos por cada R$100 gastos + 1.000 pontos por seguir no Instagram. 
            Cada ponto vale R$0,05 na lojinha de recompensas.
          </p>
        </div>
      </section>

      {/* Cartão Fidelidade */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.programIcon}>
            <CreditCard size={48} />
          </div>
          <h2 className={styles.sectionTitle}>Cartão Fidelidade Digital</h2>
          <p className={styles.sectionDescription}>Transforme compras em conquistas</p>
        </div>
        
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>
              <Settings size={32} />
            </div>
            <h3>Personalização completa</h3>
            <p>Escolha cores, nome e design do seu cartão digital</p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>
              <Calendar size={32} />
            </div>
            <h3>Regras de carimbos</h3>
            <p>Defina quantas compras são necessárias para completar o cartão</p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>
              <Gift size={32} />
            </div>
            <h3>Recompensas flexíveis</h3>
            <p>Ofereça descontos, brindes ou benefícios exclusivos</p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>
              <Calendar size={32} />
            </div>
            <h3>Expiração programada</h3>
            <p>Estabeleça validade para cartões e recompensas</p>
          </div>
        </div>
        
        <div className={styles.programExample}>
          <h3>Exemplo de uso:</h3>
          <p>
            Cartão de 10 carimbos: a cada compra, o cliente ganha um carimbo. 
            Ao completar, recebe 20% de desconto na próxima compra. Validade: 3 meses.
          </p>
        </div>
      </section>

      {/* Dashboard
      <section className={`${styles.section} ${styles.dashboardSection}`}>
        <div className={styles.dashboardContainer}>
          <div className={styles.dashboardContent}>
            <h2 className={styles.sectionTitle}>Dashboard Completo</h2>
            <p>
              Acompanhe em tempo real o desempenho de todos os seus programas de fidelidade com nossa plataforma analítica.
            </p>
            
            <ul className={styles.dashboardFeatures}>
              <li>Relatórios de utilização de créditos</li>
              <li>Desempenho por programa e por cliente</li>
              <li>Cálculo automático de ROI</li>
              <li>Previsão de gastos futuros</li>
              <li>Exportação de dados para análise</li>
              <li>Identificação de clientes mais valiosos</li>
            </ul>
          </div>
          
          <div className={styles.dashboardImage}>
            <Image 
              src="/analytics-dashboard.jpg"
              alt="Dashboard analítico"
              fill
              style={{ objectFit: "cover" }}
            />
          </div>
        </div>
      </section> */}

      {/* CTA Final */}
      <section className={styles.finalCta}>
        <h2>Pronto para transformar seus clientes em fãs fiéis?</h2>
        <p>Comece hoje mesmo com 100 créditos grátis</p>
        <a href="/signup" className={styles.ctaBtn}>Criar conta gratuita</a>
        <div className={styles.ctaNote}>Sem compromisso. Cancele quando quiser.</div>
      </section>
    </main>
  );
}
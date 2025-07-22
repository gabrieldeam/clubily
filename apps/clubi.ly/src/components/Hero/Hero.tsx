import Link from 'next/link';
import styles from './Hero.module.css';

export default function Hero() {
  return (
    <div className={styles.container}>
      {/* Seção para Empresas */}
      <section className={`${styles.hero} ${styles.heroBusiness}`}>
        {/* Objetos flutuantes */}
        <div className={styles.floatingShape1}></div>
        <div className={styles.floatingShape2}></div>
        <div className={styles.floatingShape3}></div>
        
        <div className={styles.inner}>
          <div className={styles.content}>
            <h1>
              Fidelize clientes.<br/>Aumente suas vendas.
            </h1>
            <p>
              Cashback, pontos e cartões digitais em uma única plataforma.
            </p>
            
            {/* Benefícios em cards */}
            <div className={styles.benefitsGrid}>
              <div className={styles.benefitPair}>
                <div className={styles.benefitCard}>
                  <h3>Atraia novos clientes</h3>
                  <p>Programas de fidelidade que encantam e trazem mais clientes</p>
                </div>
                <div className={styles.benefitCard}>
                  <h3>Aumente o ticket médio</h3>
                  <p>Clientes fiéis compram mais e com maior frequência</p>
                </div>
              </div>
              
              <div className={styles.benefitPair}>
                <div className={styles.benefitCard}>
                  <h3>Reduza custos de marketing</h3>
                  <p>Retenha clientes a um custo muito menor</p>
                </div>
                <div className={styles.benefitCard}>
                  <h3>Controle total</h3>
                  <p>Dashboard intuitivo para gerenciar programas</p>
                </div>
              </div>
            </div>
            
            <div className={styles.actions}>
              <Link href="/companies" className={styles.primaryBtn}>
                Testar grátis
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Seção para Clientes */}
      <section className={`${styles.hero} ${styles.heroClient}`}>
        {/* Objetos flutuantes */}
        <div className={styles.floatingShape4}></div>
        <div className={styles.floatingShape5}></div>
        
        <div className={styles.inner}>
          <div className={styles.content}>
            <h1>
              Centralize seus benefícios<br/>e maximize suas vantagens
            </h1>
            <p>
              Grátis, fácil e seguro. Tudo em um único lugar.
            </p>
            
            {/* Benefícios em cards */}
            <div className={styles.benefitsGrid}>
              <div className={styles.benefitPair}>
                <div className={styles.benefitCard}>
                  <h3>Acompanhe todos os programas</h3>
                  <p>Saldo de cashback, pontos e cartões em uma só interface</p>
                </div>
                <div className={styles.benefitCard}>
                  <h3>Resgate recompensas</h3>
                  <p>Converta seus pontos em descontos e vantagens</p>
                </div>
              </div>
              
              <div className={styles.benefitPair}>
                <div className={styles.benefitCard}>
                  <h3>Cartões sempre à mão</h3>
                  <p>Acesse seus cartões de fidelidade pelo celular</p>
                </div>
                <div className={styles.benefitCard}>
                  <h3>Ofertas exclusivas</h3>
                  <p>Descontos e vantagens especiais para membros</p>
                </div>
              </div>
            </div>
            
            <div className={styles.actions}>
              <Link href="/clients" className={styles.secondaryBtn}>
                Ver meus programas
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
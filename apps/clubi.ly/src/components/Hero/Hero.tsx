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
            
            {/* Benefícios em cards */}
            <div className={styles.benefitsGrid}>
              <div className={styles.benefitPair}>
                <div className={styles.benefitCard}>
                  <p>Atraia novos clientes</p>
                </div>
                <div className={styles.benefitCard}>
                  <p>Aumente o ticket médio</p>
                </div>
              </div>
              
              <div className={styles.benefitPair}>
                <div className={styles.benefitCard}>
                  <p>Reduza custos de marketing</p>
                </div>
                <div className={styles.benefitCard}>
                  <p>Controle total</p>
                </div>
              </div>
            </div>
            
            <p>
              Cashback, pontos e cartões digitais em uma única plataforma.
            </p>
            
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
            {/* Benefícios em cards */}
            <div className={styles.benefitsGrid}>
              <div className={styles.benefitPair}>
                <div className={styles.benefitCard}>
                  <p>Acompanhe todos os programas</p>
                </div>
                <div className={styles.benefitCard}>
                  <p>Resgate recompensas</p>
                </div>
              </div>
              
              <div className={styles.benefitPair}>
                <div className={styles.benefitCard}>
                  <p>Cartões sempre à mão</p>
                </div>
                <div className={styles.benefitCard}>
                  <p>Ofertas exclusivas</p>
                </div>
              </div>
            </div>
            
            <p>
              Grátis, fácil e seguro. Tudo em um único lugar.
            </p>
            
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
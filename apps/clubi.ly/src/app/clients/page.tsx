import Image from 'next/image';
import Link from 'next/link';
import styles from './page.module.css';

export const metadata = { title: 'Para Clientes • Clubily' };

export default function Clients() {
  return (
    <section className={styles.wrapper}>
      <h1>Seu hub de recompensas</h1>
      <p className={styles.lead}>
        Acompanhe seus cashbacks, pontos e cartões digitais em um único lugar —
        grátis, fácil e seguro.
      </p>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h2>Cashback em tempo real</h2>
          <p>
            Veja o valor acumulado por compra, datas de expiração e solicite
            saque direto no app.
          </p>
        </div>

        <div className={styles.card}>
          <h2>Pontos e trocas</h2>
          <p>
            Converta pontos por produtos físicos ou digitais sem papelada. Tudo
            dentro da sua conta Clubily.
          </p>
        </div>

        <div className={styles.card}>
          <h2>Cartões &nbsp;fidelidade</h2>
          <p>
            Acompanhe quantos carimbos faltam para ganhar aquela recompensa
            especial.
          </p>
        </div>
      </div>

      <div className={styles.appSection}>
        <Image
          src="/images/app-preview.png"
          alt="App Clubily"
          width={260}
          height={520}
          className={styles.phone}
        />

        <div className={styles.appCopy}>
          <h3>Baixe o aplicativo</h3>
          <p>
            Disponível para Android e iOS. Receba notificações de recompensas e
            encontre empresas próximas.
          </p>
          <div className={styles.storeBtns}>
            <a href="https://play.google.com" aria-label="Google Play">
              <Image
                src="/images/google-play-badge.png"
                alt=""
                width={150}
                height={44}
              />
            </a>
            <a href="https://apps.apple.com" aria-label="App Store">
              <Image
                src="/images/app-store-badge.png"
                alt=""
                width={135}
                height={44}
              />
            </a>
          </div>
        </div>
      </div>

      <Link href="https://app.clubily.com.br/login" className={styles.loginBtn}>
        Entrar na minha conta
      </Link>
    </section>
  );
}

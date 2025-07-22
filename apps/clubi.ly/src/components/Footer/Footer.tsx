// src/components/Footer/Footer.tsx

import Image from 'next/image';
import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.grid}>
        {/* logo no lugar do nome */}
        <div className={styles.logoContainer}>
          <Link href="/">
            <Image
              src="/logo.svg"
              alt="Clubily"
              width={120}
              height={40}
              className={styles.logoImage}
            />
          </Link>
          <p>Sua plataforma de fidelidade all‑in‑one.</p>
        </div>

        <div>
          <h5>Empresa</h5>
          <ul>
            <li><Link href="/solutions">Soluções</Link></li>
            <li><Link href="/pricing">Planos</Link></li>
            <li><Link href="/about">Sobre nós</Link></li>
            <li><Link href="/faq">FAQ</Link></li>
          </ul>
        </div>

        <div>
          <h5>Legal</h5>
          <ul>
            <li><Link href="/legal/terms">Termos</Link></li>
            <li><Link href="/legal/privacy">Privacidade</Link></li>
            <li><Link href="/legal/lgpd">LGPD</Link></li>
          </ul>
        </div>

        <div>
          <h5>Plataformas</h5>
          <a href="https://portal.clubi.ly">Portal Empresas</a><br/>
          <a href="https://app.clubi.ly">Portal Clientes</a>
        </div>
      </div>

      <p className={styles.copy}>
        © {new Date().getFullYear()} Clubily. Todos os direitos reservados.
      </p>
    </footer>
  );
}

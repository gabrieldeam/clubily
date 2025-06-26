// src/components/Header/Header.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useWallet } from '@/context/WalletContext';
import styles from './Header.module.css';

interface HeaderProps {
  onAccountClick?: () => void;
}

export default function Header({
  onAccountClick,
}: HeaderProps) {
  const pathname = usePathname();
  const isProfile = pathname === '/profile';
  const { balance, loading } = useWallet();

  const accountButtonClass = isProfile
    ? `${styles.accountButton} ${styles.accountButtonActive}`
    : styles.accountButton;

  return (
    <header className={styles.header}>
      {/* Logo com link para a Home */}
      <div className={styles.logo}>
        <Link href="/">
          <Image src="/logo.svg" alt="Logo" width={120} height={32} />
        </Link>
      </div>


      <div className={styles.creditProfile}>

        <Link href="/credits">
          <div className={styles.creditSection}>
            {loading ? (
              <span className={styles.creditLoading}>...</span>
            ) : (
              <span className={styles.creditText}>
                Créditos: R$ {balance.toFixed(2)}
              </span>
            )}
            <button className={styles.buyLink}>
              Comprar
            </button>
          </div>
        </Link>        

        {/* Botão Minha Conta */}
        {onAccountClick ? (
          <button
            type="button"
            className={accountButtonClass}
            onClick={onAccountClick}
          >
            <Image
              src="/user.svg"
              alt="Minha conta"
              width={24}
              height={24}
            />
            <span>Minha Conta</span>
          </button>
        ) : (
          <Link href="/profile" className={accountButtonClass}>
            <Image
              src="/user.svg"
              alt="Minha conta"
              width={24}
              height={24}
            />
            <span>Minha Conta</span>
          </Link>
        )}
      </div>
    </header>
  );
}

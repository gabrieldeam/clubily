// src/components/Header/Header.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getBalance } from '@/services/companyPaymentService';
import styles from './Header.module.css';

interface HeaderProps {
  /** Callback opcional para clique em 'Minha Conta' */
  onAccountClick?: () => void;
}

export default function Header({
  onAccountClick,
}: HeaderProps) {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const isProfile = pathname === '/profile';

  useEffect(() => {
    getBalance()
      .then(res => setBalance(res.data))
      .catch(() => setBalance(0))
      .finally(() => setLoading(false));
  }, []);

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
        {/* Seção de Créditos + Comprar */}
      <div className={styles.creditSection}>
        {loading ? (
          <span className={styles.creditLoading}>...</span>
        ) : (
          <span className={styles.creditText}>
            Créditos: R$ {balance.toFixed(2)}
          </span>
        )}
        <Link href="/credits" className={styles.buyLink}>
          Comprar
        </Link>
      </div>

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

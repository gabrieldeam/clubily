'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';

const links = [
  { href: '/solutions', label: 'Soluções' },
  { href: '/companies', label: 'Para Empresas' },
  { href: '/clients', label: 'Para Clientes' },
  { href: '/pricing', label: 'Preços' }
];

export default function Navbar() {
  const pathname = usePathname();

  // estados de aberto/fechado
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  // refs para detectar clicks fora
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  const toggleMobile = () => setMobileOpen(o => !o);
  const toggleLogin = () => setLoginOpen(o => !o);
  const closeMobile = () => setMobileOpen(false);
  const closeLogin = () => setLoginOpen(false);

  // click fora fecha ambos
  useEffect(() => {
    function handleClickOutside(ev: MouseEvent) {
      const tgt = ev.target as Node;

      // fechar login dropdown
      if (
        loginOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(tgt)
      ) {
        closeLogin();
      }

      // fechar menu mobile
      if (
        mobileOpen &&
        menuRef.current &&
        hamburgerRef.current &&
        !menuRef.current.contains(tgt) &&
        !hamburgerRef.current.contains(tgt)
      ) {
        closeMobile();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [loginOpen, mobileOpen]);

  return (
    <header className={`${styles.header} ${mobileOpen ? styles.noRadius : ''}`}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo} onClick={closeMobile}>
          <Image src="/logo.svg" alt="Clubily" width={120} height={32} priority />
        </Link>

        {/* menu principal */}
        <ul
          ref={menuRef}
          className={`${styles.menu} ${mobileOpen ? styles.open : ''}`}
        >
          {links.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`${styles.link} ${
                  pathname === href ? styles.active : ''
                }`}
                onClick={closeMobile}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <div className={styles.menudrops}>
          {/* dropdown de login */}
          <div ref={dropdownRef} className={styles.dropdown}>
            <button
              type="button"
              className={styles.loginBtn}
              onClick={toggleLogin}
            >
              Entrar
            </button>
            <ul
              className={`${styles.dropdownMenu} ${
                loginOpen ? styles.open : ''
              }`}
            >
              <li>
                <a
                  href="https://app.clubi.ly"
                  className={styles.dropdownItem}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Como Cliente
                </a>
              </li>
              <li>
                <a
                  href="https://portal.clubi.ly"
                  className={styles.dropdownItem}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Como Empresa
                </a>
              </li>
            </ul>
          </div>

          {/* hamburger (mobile) */}
          <button
            ref={hamburgerRef}
            className={styles.hamburger}
            onClick={toggleMobile}
            aria-label="Abrir menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>
    </header>
  );
}

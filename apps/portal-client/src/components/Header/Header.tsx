'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import styles from './Header.module.css';

interface HeaderProps {
  /** Callback para pesquisa */
  onSearch?: (query: string) => void;
  /** Callback opcional para clique em 'Minha Conta' */
  onAccountClick?: () => void;
}

export default function Header({
  onSearch = () => {},
  onAccountClick,
}: HeaderProps) {
  const [query, setQuery] = useState('');
  const pathname = usePathname();
  const isProfile = pathname === '/profile';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const clearSearch = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <header className={styles.header}>
      {/* Logo com link para a Home */}
      <div className={styles.logo}>
        <Link href="/">
          <Image src="/logo.svg" alt="Logo" width={120} height={32} />
        </Link>
      </div>

      {/* Seção de pesquisa + Minha Conta */}
      <div className={styles.searchSection}>
        <form className={styles.searchWrapper} onSubmit={handleSearch}>
          <div className={styles.searchIcon}>
            <Image
              src="/procurar.svg"
              alt="Buscar"
              width={20}
              height={20}
            />
          </div>
          <input
            name="search"
            type="text"
            placeholder="Pesquisar..."
            className={styles.searchInput}
            value={query}
            onChange={handleInputChange}
          />
          {query && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={clearSearch}
            >
              Cancelar
            </button>
          )}
        </form>
      </div>
    </header>
  );
}
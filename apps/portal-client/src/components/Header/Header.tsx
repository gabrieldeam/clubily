'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import Modal from '@/components/Modal/Modal'; 
import AddressManager from '@/components/AddressManager/AddressManager';
import styles from './Header.module.css';

interface HeaderProps {
  onSearch?: (query: string) => void;
  onAccountClick?: () => void;
}

export default function Header({
  onSearch = () => {},
  onAccountClick,
}: HeaderProps) {
  const [query, setQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isProfile = isModalOpen;

  useEffect(() => {
    const handler = () => setIsModalOpen(true);
    window.addEventListener('openAddressModal', handler);
    return () => {
      window.removeEventListener('openAddressModal', handler);
    };
  }, []);

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

  const openAccountModal = () => {
    onAccountClick?.();
    setIsModalOpen(true);
  };

  const closeAccountModal = () => {
    setIsModalOpen(false);
  };

  const accountButtonClass = isProfile
    ? `${styles.accountButton} ${styles.accountButtonActive}`
    : styles.accountButton;

  return (
    <>
      <header className={styles.header}>
        <div className={styles.logo}>
          <Link href="/">
            <Image src="/logo.svg" alt="Logo" width={120} height={32} />
          </Link>
        </div>

        <div className={styles.searchSection}>
          <button
            type="button"
            className={accountButtonClass}
            onClick={openAccountModal}
          >
            <Image src="/icons/address.svg" alt="Endereços" width={24} height={24} />
            <span>Endereços</span>
          </button>

          <form className={styles.searchWrapper} onSubmit={handleSearch}>
            <div className={styles.searchIcon}>
              <Image src="/procurar.svg" alt="Buscar" width={20} height={20} />
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

      <Modal open={isModalOpen} onClose={closeAccountModal}>
        <div className={styles.background}>
           <AddressManager />
         </div>
      </Modal>
    </>
  );
}

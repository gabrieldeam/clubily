// src/components/Header/Header.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useAddress } from '@/context/AddressContext';
import Modal from '@/components/Modal/Modal';
import AddressManager from '@/components/AddressManager/AddressManager';
import styles from './Header.module.css';

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export default function Header({ onSearch = () => {} }: HeaderProps) {
  const { selectedAddress, loading: loadingAddr } = useAddress();
  const [query, setQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1) Só abrir modal quando termos carregado os endereços e não houver seleção
  useEffect(() => {
    if (!loadingAddr && !selectedAddress) {
      setIsModalOpen(true);
    }
  }, [loadingAddr, selectedAddress]);

  // 2) Listener para evento programático
  useEffect(() => {
    const handler = () => setIsModalOpen(true);
    window.addEventListener('openAddressModal', handler);
    return () => window.removeEventListener('openAddressModal', handler);
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
            className={styles.accountButton}
            onClick={() => setIsModalOpen(true)}
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
              <button type="button" className={styles.clearButton} onClick={clearSearch}>
                Cancelar
              </button>
            )}
          </form>
        </div>
      </header>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className={styles.background}>
          <AddressManager onClose={() => setIsModalOpen(false)} />
        </div>
      </Modal>
    </>
  );
}

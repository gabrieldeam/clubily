'use client';

import React, { useEffect, useState, useRef } from 'react';
import Header from '@/components/Header/Header';
import Image from 'next/image';
import { useAddress } from '@/context/AddressContext';
import { listUsedCategories } from '@/services/categoryService';
import type { CategoryRead } from '@/types/category';
import styles from './Dashboard.module.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Dashboard() {
  const { selectedAddress } = useAddress();
  const [cats, setCats] = useState<CategoryRead[]>([]);
  const [loading, setLoading] = useState(true);

  // Campo de filtro: city, street, postal_code, country
  const [filterField, setFilterField] = useState<'city' | 'street' | 'postal_code' | 'country'>('city');

  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';

  // Fetch de categorias quando muda endereço ou tipo de filtro
  useEffect(() => {
    let mounted = true;
    async function fetchCats() {
      if (!selectedAddress || !selectedAddress[filterField]) {
        if (mounted) {
          setCats([]);
          setLoading(false);
        }
        return;
      }
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        params[filterField] = selectedAddress[filterField] as string;
        const res = await listUsedCategories(params);
        if (mounted) setCats(res.data);
      } catch (err) {
        console.error('Erro ao carregar categorias:', err);
        if (mounted) setCats([]);
      } finally {
        if (mounted) setLoading(false);
        updateScrollButtons();
      }
    }
    fetchCats();
    return () => { mounted = false; };
  }, [selectedAddress, filterField]);

  const updateScrollButtons = () => {
    const el = containerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollWidth - el.clientWidth - el.scrollLeft > 0);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollButtons);
    window.addEventListener('resize', updateScrollButtons);
    updateScrollButtons();
    return () => {
      el.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [cats]);

  const scrollBy = (distance: number) => {
    containerRef.current?.scrollBy({ left: distance, behavior: 'smooth' });
  };

  return (
    <div>
      <Header onSearch={q => console.log('Pesquisar por:', q)} />

      <div className={styles.gridItem}>
        {/* Cabeçalho com select embutido */}
        <h4 className={styles.inlineHeader}>
          Categorias em{' '}
          <select
            value={filterField}
            onChange={e => setFilterField(e.target.value as typeof filterField)}
            className={styles.filterSelect}
          >
            <option value="city">Cidade</option>
            <option value="street">Rua</option>
            <option value="postal_code">CEP</option>
            <option value="country">País</option>
          </select>
          {' '}
          <span className={styles.filterValue}>
            {selectedAddress?.[filterField] ?? '...'}
          </span>
        </h4>

        {loading && <p>Carregando categorias...</p>}

        {!loading && !selectedAddress && (
          <p>Por favor, selecione um endereço para ver categorias.</p>
        )}

        {canScrollLeft && (
          <button
            className={`${styles.arrowButton} ${styles.arrowLeft}`}
            onClick={() => scrollBy(-200)}
            aria-label="Scroll para esquerda"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        <div
          ref={containerRef}
          className={styles.categoriesGrid}
        >
          {!loading && cats.map(cat => (
            <div key={cat.id} className={styles.card}>
              <Image
                src={`${baseUrl}${cat.image_url ?? ''}`}
                alt={cat.name}
                width={30}
                height={30}
                className={styles.logo}
              />
              <span className={styles.name}>{cat.name}</span>
            </div>
          ))}
        </div>

        {canScrollRight && (
          <button
            className={`${styles.arrowButton} ${styles.arrowRight}`}
            onClick={() => scrollBy(200)}
            aria-label="Scroll para direita"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
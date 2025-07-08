// src/components/CategoryListModal/CategoryListModal.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Modal from '@/components/Modal/Modal';
import { listRewardCategories } from '@/services/rewardsService';
import type { RewardCategoryRead, PaginatedRewardCategory } from '@/types/reward';
import { getIconBySlug } from '@/utils/getIconBySlug';
import styles from './CategoryListModal.module.css';

interface CategoryListModalProps {
  open: boolean;
  onClose: () => void;
  onSelectCategory: (id: string, name: string) => void;  // nova prop
}

export default function CategoryListModal({ open, onClose, onSelectCategory }: CategoryListModalProps) {
  const [categories, setCategories] = useState<RewardCategoryRead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    listRewardCategories(page * limit, limit)
      .then(res => {
        const data: PaginatedRewardCategory = res.data;
        setCategories(data.items);
        setTotal(data.total);
        setError(null);
      })
      .catch(() => setError('Erro ao carregar categorias.'))
      .finally(() => setLoading(false));
  }, [open, page]);

  const totalPages = Math.ceil(total / limit);
  const handleClose = () => onClose();

  return (
    <Modal open={open} onClose={handleClose} width={600}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h2>Categorias</h2>
        </header>

        {loading && <p>Carregando categorias…</p>}
        {error && <p className={styles.error}>{error}</p>}

        {!loading && !error && (
          <>
            <ul className={styles.list}>
              {categories.map(cat => {
                const Icon = getIconBySlug(cat.slug);
                return (
                  <li key={cat.id} className={styles.item} onClick={() => { onSelectCategory(cat.id, cat.name);}}>
                    <Icon className={styles.icon} />
                    <span className={styles.name}>{cat.name}</span>
                  </li>
                );
              })}
            </ul>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    className={`${styles.page} ${page === i ? styles.active : ''}`}
                    onClick={() => setPage(i)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
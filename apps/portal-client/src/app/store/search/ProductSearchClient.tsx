// src/app/store/search/ProductSearchClient.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import ProductDetailModal from '@/components/ProductDetailModal/ProductDetailModal';
import { searchRewardProducts } from '@/services/rewardsService';
import { useCart } from '@/context/CartContext';
import type {
  RewardProductRead,
  PaginatedRewardProduct,
} from '@/types/reward';
import styles from './page.module.css';

type Props = { q: string };

export default function ProductSearchClient({ q }: Props) {
  const { addItem } = useCart();

  const [products, setProducts] = useState<RewardProductRead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const limit = 10;

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';
  const imgSrc = (path?: string | null) =>
    path ? `${baseUrl}${path}` : '/placeholder.png';

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    setError(null);

    searchRewardProducts(q, page * limit, limit)
      .then((res) => {
        const data: PaginatedRewardProduct = res.data;
        setProducts(data.items);
        setTotal(data.total);
      })
      .catch(() => setError('Erro ao buscar produtos.'))
      .finally(() => setLoading(false));
  }, [q, page]);

  const totalPages = Math.ceil(total / limit);

  const handleCardClick = (id: string) => {
    setSelectedProductId(id);
    setModalOpen(true);
  };

  return (
    <>
      {loading && <p>Carregando resultados…</p>}
      {error && <p className={styles.error}>{error}</p>}
      {!loading && !error && products.length === 0 && (
        <p className={styles.message}>Nenhum produto encontrado.</p>
      )}

      <div className={styles.productsGridAll}>
        {products.map((p) => (
          <div
            key={p.id}
            className={styles.productCardAll}
            onClick={() => handleCardClick(p.id)}
          >
            <Image
              src={imgSrc(p.image_url)}
              alt={p.name}
              width={160}
              height={160}
              sizes="160px"
            />
            <p className={styles.prodName}>{p.name}</p>
            <p className={styles.prodCost}>{p.points_cost} pts</p>
            <button
              className={styles.resgatarBtn}
              onClick={(e) => {
                e.stopPropagation();
                addItem({
                  id: p.id,
                  name: p.name,
                  image_url: p.image_url ?? undefined,
                  points_cost: p.points_cost,
                  quantity: 1,
                });
              }}
            >
              Resgatar
            </button>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className={styles.paginationAll}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              className={`${styles.pageAll} ${
                page === i ? styles.pageAllActive : ''
              }`}
              onClick={() => setPage(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      <ProductDetailModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        productId={selectedProductId}
      />
    </>
  );
}

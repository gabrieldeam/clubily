'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header/Header';
import ProductDetailModal from '@/components/ProductDetailModal/ProductDetailModal';
import { searchRewardProducts } from '@/services/rewardsService';
import { useCart } from '@/context/CartContext';          // ① importe o hook
import type { RewardProductRead, PaginatedRewardProduct } from '@/types/reward';
import styles from './page.module.css';

export default function ProductSearchPage() {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get('name')?.trim() ?? '';

  // hook do carrinho
  const { addItem } = useCart();                           // ② pegue o addItem

  // estados de busca
  const [products, setProducts] = useState<RewardProductRead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const limit = 10;

  // estado do modal
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // base URL para imagens
  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    setError(null);

    searchRewardProducts(q, page * limit, limit)
      .then(res => {
        const data: PaginatedRewardProduct = res.data;
        setProducts(data.items);
        setTotal(data.total);
      })
      .catch(() => setError('Erro ao buscar produtos.'))
      .finally(() => setLoading(false));
  }, [q, page]);

  const totalPages = Math.ceil(total / limit);

  const imgSrc = (path?: string | null) =>
    path ? `${baseUrl}${path}` : '/placeholder.png';

  const handleCardClick = (id: string) => {
    setSelectedProductId(id);
    setModalOpen(true);
  };

  return (
    <>
      <Header onSearch={str => router.push(`/store/search?name=${encodeURIComponent(str)}`)} />

      <div className={styles.container}>
        <section className={styles.allProductsSection}>
          <h2 className={styles.allProductsHeader}>
            Resultados para “{q}”
          </h2>

          {loading && <p>Carregando resultados…</p>}
          {error && <p className={styles.error}>{error}</p>}
          {!loading && !error && products.length === 0 && (
            <p className={styles.message}>Nenhum produto encontrado.</p>
          )}

          <div className={styles.productsGridAll}>
            {products.map(p => (
              <div
                key={p.id}
                className={styles.productCardAll}
                onClick={() => handleCardClick(p.id)}
              >
                <img
                  src={imgSrc(p.image_url)}
                  alt={p.name}
                />
                <p className={styles.prodName}>{p.name}</p>
                <p className={styles.prodCost}>{p.points_cost} pts</p>
                <button
                  className={styles.resgatarBtn}
                  onClick={e => {
                    e.stopPropagation();             // ③ previne abrir a modal
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
                  className={`${styles.pageAll} ${page === i ? styles.pageAllActive : ''}`}
                  onClick={() => setPage(i)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      <ProductDetailModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        productId={selectedProductId}
      />
    </>
  );
}

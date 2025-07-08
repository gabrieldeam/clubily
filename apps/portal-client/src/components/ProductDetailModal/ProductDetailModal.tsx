'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal/Modal';
import { getRewardProductById } from '@/services/rewardsService';
import type { RewardProductRead } from '@/types/reward';
import styles from './ProductDetailModal.module.css';

interface ProductDetailModalProps {
  open: boolean;
  onClose: () => void;
  productId: string | null;
}

export default function ProductDetailModal({
  open,
  onClose,
  productId,
}: ProductDetailModalProps) {
  const [product, setProduct] = useState<RewardProductRead | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Base URL para imagens
  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';

  useEffect(() => {
    if (!open || !productId) {
      setProduct(null);
      return;
    }
    setLoading(true);
    getRewardProductById(productId)
      .then(res => {
        setProduct(res.data);
        setError(null);
      })
      .catch(err => {
        console.error(err);
        setError('Erro ao carregar produto.');
      })
      .finally(() => setLoading(false));
  }, [open, productId]);

  const imgSrc = (path?: string | null) =>
    path ? `${baseUrl}${path}` : '/placeholder.png';

  return (
    <Modal open={open} onClose={onClose} width={600}>
      <div className={styles.container}>
        {loading && <p>Carregando...</p>}
        {error && <p className={styles.error}>{error}</p>}
        {product && (
          <>
            <header className={styles.header}>
              <img
                src={imgSrc(product.image_url)}
                alt={product.name}
                className={styles.image}
              />
              <div className={styles.info}>
                <h2 className={styles.name}>{product.name}</h2>
                <p className={styles.sku}>SKU: {product.sku}</p>
                <p className={styles.cost}>{product.points_cost} pts</p>
              </div>
            </header>
            {product.short_desc && (
              <p className={styles.shortDesc}>{product.short_desc}</p>
            )}
            {product.long_desc && (
              <div className={styles.longDesc}>
                <h4>Descrição</h4>
                <p>{product.long_desc}</p>
              </div>
            )}
            {product.categories.length > 0 && (
              <div className={styles.categories}>
                <h4>Categorias</h4>
                <ul>
                  {product.categories.map(cat => (
                    <li key={cat.id}>{cat.name}</li>
                  ))}
                </ul>
              </div>
            )}
            {product.pdf_url && (
              <p className={styles.pdf}>
                <a href={product.pdf_url} target="_blank" rel="noopener noreferrer">
                  Ver PDF do produto
                </a>
              </p>
            )}
            <p className={styles.createdAt}>
              Criado em: {new Date(product.created_at).toLocaleDateString('pt-BR')}
            </p>
          </>
        )}
      </div>
    </Modal>
  );
}

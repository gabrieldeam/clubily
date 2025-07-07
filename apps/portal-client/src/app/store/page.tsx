// src/app/store/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { getIconBySlug } from '@/utils/getIconBySlug';
import * as Icons from 'lucide-react';
import Header from '@/components/Header/Header';
import Slider from '@/components/Slider/Slider';
import {
  listRewardCategories,
  listRewardProducts,
  listRewardProductsByCategory,
  getRewardProductById,
} from '@/services/rewardsService';
import { getUserPointsBalance } from '@/services/pointsUserService';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import type {
  RewardCategoryRead,
  RewardProductRead,
  PaginatedRewardProduct,
} from '@/types/reward';
import styles from './page.module.css';

const FEATURED_CATEGORY_ID = 'e6931a92-c4a3-4d61-9e5f-b428a212d527';
const FEATURED_PRODUCT_IDS = [
  '2dc48a17-d957-4fb3-ae9c-7c1e031f57d6',
  '627d20cd-b31c-4f13-a1ed-fdb228199a22',
  'f760151d-e84d-4ab7-aa18-1d437b608091',
  '9fec41c7-ebf4-4ea9-9e3a-03ffdd901bf5',
];

export default function StorePage() {
  const { user } = useAuth();
  const { items: cartItems, addItem } = useCart();

  // categorias
  const [categories, setCategories] = useState<RewardCategoryRead[]>([]);
  const [showAllCats, setShowAllCats] = useState(false);
  const [catsPerPage, setCatsPerPage] = useState(10);

  // produtos e destaques
  const [electronics, setElectronics] = useState<PaginatedRewardProduct>({
    total: 0, skip: 0, limit: 12, items: []
  });
  const [featuredProducts, setFeaturedProducts] = useState<RewardProductRead[]>([]);
  const [allProducts, setAllProducts] = useState<PaginatedRewardProduct>({
    total: 0, skip: 0, limit: 12, items: []
  });
  const [skipAll, setSkipAll] = useState(0);

  // saldo e carrinho
  const [balance, setBalance] = useState(0);
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  // responsivo: quantos cards mostrar
  const gridRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(7);
  const highlightRef = useRef<HTMLDivElement>(null);
  const [visibleHighlights, setVisibleHighlights] = useState(FEATURED_PRODUCT_IDS.length);

  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';
  const limitAll = 12;
  const totalPagesAll = Math.ceil(allProducts.total / limitAll);

  // ajusta catsPerPage em ≤1024px
  useEffect(() => {
    const update = () => setCatsPerPage(window.innerWidth <= 1024 ? 4 : 10);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // fetch inicial
  useEffect(() => {
    listRewardCategories(0, 100).then(res => setCategories(res.data.items));
    getUserPointsBalance().then(res => setBalance(res.data.balance));
    listRewardProducts(skipAll, limitAll).then(res => setAllProducts(res.data));
  }, [skipAll]);

  useEffect(() => {
    listRewardProductsByCategory(FEATURED_CATEGORY_ID, 0, 12)
      .then(res => setElectronics(res.data));
  }, []);

  useEffect(() => {
    Promise.all(
      FEATURED_PRODUCT_IDS.map(id =>
        getRewardProductById(id).then(res => res.data)
      )
    ).then(setFeaturedProducts);
  }, []);

  // observa largura do grid de eletrônicos
  useEffect(() => {
    if (!gridRef.current) return;
    const obs = new ResizeObserver(entries => {
      for (let { contentRect } of entries) {
        const width = contentRect.width;
        const cardMin = 100, gap = 10;
        const count = Math.floor((width + gap) / (cardMin + gap));
        setVisibleCount(Math.max(1, count));
      }
    });
    obs.observe(gridRef.current);
    return () => obs.disconnect();
  }, []);

  // observa largura do destaque
  useEffect(() => {
    if (!highlightRef.current) return;
    const obs = new ResizeObserver(entries => {
      for (let { contentRect } of entries) {
        const width = contentRect.width;
        const cardMin = 180, gap = 12;
        const count = Math.floor((width + gap) / (cardMin + gap));
        setVisibleHighlights(Math.max(1, count));
      }
    });
    obs.observe(highlightRef.current);
    return () => obs.disconnect();
  }, []);

  const imgSrc = (path?: string) => path ? `${baseUrl}${path}` : '/placeholder.png';

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.header}>
          {/* Sidebar de categorias */}
          <aside className={styles.sidebar}>
            <ul className={styles.categoryList}>
              {(showAllCats ? categories : categories.slice(0, 10)).map(cat => {
                const Icon = getIconBySlug(cat.slug);
                return (
                  <li key={cat.id} className={styles.categoryItem}>
                    <Icon />
                    <span>{cat.name}</span>
                  </li>
                );
              })}
              {categories.length > 10 && (
                <li
                  className={styles.showAllItem}
                  onClick={() => setShowAllCats(!showAllCats)}
                >
                  {showAllCats ? 'Ver menos' : 'Ver todos'}
                </li>
              )}
            </ul>
          </aside>

          {/* Área principal */}
          <main className={styles.main}>
            {/* Linha de cima: slider + eletrônicos */}
            <section className={styles.topRow}>
              <div className={styles.sliderBox}>
                <Slider>
                  <img
                    src="https://img.freepik.com/vetores-gratis/banner-de-compra-online-com-carrinho-de-compras-3d-nuvens-e-icones-sociais-ilustracao-vetorial_548887-100.jpg"
                    alt="Banner 1"
                  />
                  <img
                    src="https://img.freepik.com/vetores-gratis/banner-de-tempo-de-compra-com-mapa-realista-carrinho-e-sacolas-de-presente-ilustracao-vetorial_548887-120.jpg"
                    alt="Banner 2"
                  />
                </Slider>
              </div>
              <div className={styles.electronicsBox}>
                <header className={styles.sectionHeader}>
                  <h2>Eletrônicos</h2>
                  <Icons.ArrowRight size={20} />
                </header>
                <div ref={gridRef} className={styles.productsGrid}>
                  {electronics.items.slice(0, visibleCount).map(p => (
                    <div key={p.id} className={styles.productCard}>
                      <img
                        className={styles.electronicsImage}
                        src={imgSrc(p.image_url ?? undefined)}
                        alt={p.name}
                      />
                      <p className={`${styles.prodName} ${styles.truncateTwoLines}`}>
                        {p.name}
                      </p>
                      <p className={styles.prodCost}>{p.points_cost} pts</p>
                      <button
                        className={styles.resgatarBtn}
                        disabled={balance < p.points_cost}
                        onClick={() =>
                          addItem({
                            id: p.id,
                            name: p.name,
                            image_url: p.image_url ?? undefined,
                            points_cost: p.points_cost,
                            quantity: 1,
                          })
                        }
                      >
                        {balance >= p.points_cost ? 'Resgatar' : 'Sem pontos'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Linha de baixo: destaque */}
            <section ref={highlightRef} className={styles.bottomRow}>
              {featuredProducts.slice(0, visibleHighlights).map(p => (
                <div key={p.id} className={styles.highlightCard}>
                  <img
                    src={imgSrc(p.image_url ?? undefined)}
                    alt={p.name}
                  />
                  <p className={`${styles.highlightName} ${styles.truncateTwoLines}`}>
                    {p.name}
                  </p>
                  <span>{p.points_cost} pts</span>
                  <button
                    className={styles.resgatarBtn}
                    disabled={balance < p.points_cost}
                    onClick={() =>
                      addItem({
                        id: p.id,
                        name: p.name,
                        image_url: p.image_url ?? undefined,
                        points_cost: p.points_cost,
                        quantity: 1,
                      })
                    }
                  >
                    {balance >= p.points_cost ? 'Resgatar' : 'Sem pontos'}
                  </button>
                </div>
              ))}
            </section>
          </main>

          {/* Painel direito */}
          
          <div className={styles.twoSection}>
            <aside className={styles.panel}>
            {user && (
              <div className={styles.userInfo}>
                <Icons.User className={styles.userIcon} />
                <div>
                  <p>Olá, <strong>{user.name}</strong></p>
                  <p>Saldo: <strong>{balance} pts</strong></p>
                </div>
              </div>
            )}
            <div className={styles.actions}>
              <button
                className={styles.iconButton}
                onClick={() => window.location.href = '/cart'}
              >
                <Icons.ShoppingCart />
                {cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
              </button>
              <button
                className={styles.iconButton}
                onClick={() => window.location.href = '/orders'}
              >
                <Icons.Package />
              </button>
            </div>
            <div className={styles.panelSection}>
              <h4>Como funciona</h4>
              <p>
                Acumule pontos a cada resgate e troque-os por recompensas exclusivas.
                Seu saldo fica sempre à mão neste painel!
              </p>
            </div>
            <div className={styles.panelSection}>
              <h4>Política de Troca</h4>
              <p>
                Trocas em até 7 dias, com embalagem original e sem uso.
              </p>
            </div>
            <div className={styles.panelSection}>
              <h4>Política de Reembolso</h4>
              <p>
                Reembolsos em até 10 dias úteis, creditados em pontos.
              </p>
            </div>
            <div className={styles.panelFooter}>
              <a href="/ajuda" className={styles.footerLink}>Central de Ajuda</a>
              <a href="/contato" className={styles.footerLink}>Fale Conosco</a>
            </div>
          </aside>
          <aside className={styles.sidebarTwo}>
            <ul className={styles.categoryList}>
              {(showAllCats ? categories : categories.slice(0, 7)).map(cat => {
                const Icon = getIconBySlug(cat.slug);
                return (
                  <li key={cat.id} className={styles.categoryItem}>
                    <Icon />
                    <span>{cat.name}</span>
                  </li>
                );
              })}
              {categories.length > 7 && (
                <li
                  className={styles.showAllItem}
                  onClick={() => setShowAllCats(!showAllCats)}
                >
                  {showAllCats ? 'Ver menos' : 'Ver todos'}
                </li>
              )}
            </ul>
          </aside>
          </div>
        </div>

        {/* Todos os produtos */}
        <section className={styles.allProductsSection}>
          <h2 className={styles.allProductsHeader}>Todos os produtos</h2>
          <div className={styles.productsGridAll}>
            {allProducts.items.map(p => (
              <div key={p.id} className={styles.productCard}>
                <img
                  src={imgSrc(p.image_url ?? undefined)}
                  alt={p.name}
                />
                <p className={styles.prodName}>{p.name}</p>
                <p className={styles.prodCost}>{p.points_cost} pts</p>
                <button
                  className={styles.resgatarBtn}
                  disabled={balance < p.points_cost}
                  onClick={() =>
                    addItem({
                      id: p.id,
                      name: p.name,
                      image_url: p.image_url ?? undefined,
                      points_cost: p.points_cost,
                      quantity: 1,
                    })
                  }
                >
                  {balance >= p.points_cost ? 'Resgatar' : 'Sem pontos'}
                </button>
              </div>
            ))}
          </div>
          {totalPagesAll > 1 && (
            <div className={styles.paginationAll}>
              {Array.from({ length: totalPagesAll }).map((_, i) => (
                <button
                  key={i}
                  className={`${styles.pageAll} ${
                    skipAll / limitAll === i ? styles.pageAllActive : ''
                  }`}
                  onClick={() => setSkipAll(i * limitAll)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

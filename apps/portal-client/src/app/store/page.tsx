// src/app/store/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getIconBySlug } from '@/utils/getIconBySlug';
import * as Icons from 'lucide-react';
import Header from '@/components/Header/Header';
import Loading from '@/components/Loading/Loading';
import Slider from '@/components/Slider/Slider';
import ProductDetailModal from '@/components/ProductDetailModal/ProductDetailModal';
import CategoryListModal from '@/components/CategoryListModal/CategoryListModal';
import {
  listRewardCategories,
  listRewardProducts,
  listRewardProductsByCategory,
  getRewardProductById,
} from '@/services/rewardsService';
import { listActiveSlides } from '@/services/slideService';
import {
  getCategorySelection,
  listProductSelections,
} from '@/services/selectionService';
import { getUserPointsBalance } from '@/services/pointsUserService';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import type {
  RewardCategoryRead,
  RewardProductRead,
  PaginatedRewardProduct,
  PaginatedRewardProductWithCategory,
} from '@/types/reward';
import type { SlideImageRead } from '@/types/slide';
import styles from './page.module.css';

export default function StorePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { items: cartItems, addItem } = useCart();

  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingAllProducts, setLoadingAllProducts] = useState(true);


  /* ──────────── estados de seleção dinâmica ──────────── */
  const [featuredCategoryId, setFeaturedCategoryId] =
    useState<string | null>(null);
  const [featuredProductIds, setFeaturedProductIds] = useState<string[]>([]);

  /* ──────────── categorias ──────────── */
  const [categories, setCategories] = useState<RewardCategoryRead[]>([]);
  const [showAllCats] = useState(false);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState('');

  const emptyCategory: RewardCategoryRead = {
    id: '',
    name: '',
    slug: '',
    created_at: '',
  };
  const createEmptyPaginated =
    (): PaginatedRewardProductWithCategory => ({
      total: 0,
      skip: 0,
      limit: 12,
      category: emptyCategory,
      items: [],
    });

  /* ──────────── produtos ──────────── */
  const [electronics, setElectronics] =
    useState<PaginatedRewardProductWithCategory>(createEmptyPaginated());
  const [featuredProducts, setFeaturedProducts] = useState<
    RewardProductRead[]
  >([]);
  const [allProducts, setAllProducts] = useState<PaginatedRewardProduct>(
    createEmptyPaginated(),
  );
  const [catProducts, setCatProducts] = useState<PaginatedRewardProduct>(
    createEmptyPaginated(),
  );
  const [skipAll, setSkipAll] = useState(0);
  const [skipCat, setSkipCat] = useState(0);
  const limit = 12;

  /* ──────────── slides ──────────── */
  const [slides, setSlides] = useState<SlideImageRead[]>([]);
  const [loadingSlides, setLoadingSlides] = useState(true);

  /* ──────────── saldo / carrinho ──────────── */
  const [balance, setBalance] = useState(0);
  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);

  /* ──────────── responsivo para grids ──────────── */
  const gridRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(7);

  const highlightRef = useRef<HTMLDivElement>(null);
  const [visibleHighlights, setVisibleHighlights] = useState(3);

  /* ──────────── modal de produto ──────────── */
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );

  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';
  const imgSrc = (path?: string | null) =>
    path ? `${baseUrl}${path}` : '/placeholder.png';

  /* ======= efeitos ======= */

  /* seleção dinâmica (categoria + produtos) */
  useEffect(() => {
    getCategorySelection()
      .then((r) => setFeaturedCategoryId(r.data.item_id))
      .catch(console.error);

    listProductSelections()
      .then((r) => setFeaturedProductIds(r.data.map((p) => p.item_id)))
      .catch(console.error);
  }, []);

  /* slides */
  useEffect(() => {
    listActiveSlides()
      .then((r) => setSlides(r.data))
      .catch(console.error)
      .finally(() => setLoadingSlides(false));
  }, []);

  /* categorias, saldo, todos os produtos  */
  useEffect(() => {
    Promise.all([
      listRewardCategories(0, 100).then((r) => setCategories(r.data.items)),
      getUserPointsBalance().then((r) => setBalance(r.data.balance)),
      listRewardProducts(skipAll, limit).then((r) => setAllProducts(r.data)),
    ])
      .catch(console.error)
      .finally(() => {
        setLoadingCats(false);
        setLoadingBalance(false);
        setLoadingAllProducts(false);
      });
  }, [skipAll]);
  
  /* produtos por categoria selecionada */
  useEffect(() => {
    if (!selectedCategoryId) return;
    listRewardProductsByCategory(selectedCategoryId, skipCat, limit)
      .then((r) => setCatProducts(r.data))
      .catch(console.error);
  }, [selectedCategoryId, skipCat]);

  /* “eletrônicos” (categoria em destaque) */
  useEffect(() => {
    if (!featuredCategoryId) return;
    listRewardProductsByCategory(featuredCategoryId, 0, 12)
      .then((r) => setElectronics(r.data))
      .catch(console.error);
  }, [featuredCategoryId]);

  /* produtos em destaque */
  useEffect(() => {
    if (featuredProductIds.length === 0) return;
    Promise.all(
      featuredProductIds.map((id) => getRewardProductById(id).then((r) => r.data)),
    )
      .then(setFeaturedProducts)
      .catch(console.error);
  }, [featuredProductIds]);

  /* grid responsivo – eletrônicos */
  useEffect(() => {
    if (!gridRef.current) return;
    const obs = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      const count = Math.floor((width + 10) / (100 + 10));
      setVisibleCount(Math.max(1, count));
    });
    obs.observe(gridRef.current);
    return () => obs.disconnect();
  }, []);

  /* responsivo destaques */
  useEffect(() => {
    if (!highlightRef.current) return;
    const obs = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      const count = Math.floor((width + 12) / (180 + 12));
      setVisibleHighlights(Math.max(1, count));
    });
    obs.observe(highlightRef.current);
    return () => obs.disconnect();
  }, []);

  /* ======= helpers ======= */

  const handleCategoryClick = (id: string, name: string) => {
    setSelectedCategoryId(id);
    setSelectedCategoryName(name);
    setSkipCat(0);
    setCatModalOpen(false);
  };
  const clearCategory = () => setSelectedCategoryId(null);

  const featuredCategory = categories.find(
    (c) => c.id === featuredCategoryId,
  );

  const totalPagesAll = Math.ceil(allProducts.total / (visibleCount * 2));
  const totalPagesCat = Math.ceil(catProducts.total / (visibleCount * 2));

   if (
    !user ||
    loadingSlides ||
    loadingCats ||
    loadingBalance ||
    loadingAllProducts
  ) {
    return <Loading />;
  }

  /* ======= render ======= */
  return (
    <>
      <Header
        onSearch={(q) =>
          router.push(`/store/search?name=${encodeURIComponent(q)}`)
        }
      />

      <div className={styles.container}>
        <div className={styles.header}>
          {/* —————————————————— Sidebar de categorias —————————————————— */}
          <aside className={styles.sidebar}>
            <ul className={styles.categoryList}>
              {(showAllCats ? categories : categories.slice(0, 10)).map((cat) => {
                const Icon = getIconBySlug(cat.slug);
                return (
                  <li
                    key={cat.id}
                    className={styles.categoryItem}
                    onClick={() => handleCategoryClick(cat.id, cat.name)}
                  >
                    <Icon />
                    <span>{cat.name}</span>
                  </li>
                );
              })}
              {categories.length > 10 && (
                <li
                  className={styles.showAllItem}
                  onClick={() => setCatModalOpen(true)}
                >
                  Ver todos
                </li>
              )}
            </ul>
          </aside>

          {/* —————————————————— Área principal —————————————————— */}
          <main className={styles.main}>
            {/* ========== Linha de cima: slider + categoria destaque ========== */}
            <section className={styles.topRow}>
              {/* —— Slider —— */}
              <div className={styles.sliderBox}>
                {loadingSlides || slides.length === 0 ? (
                  <div className={styles.emptySlide}>
                    <Image
                      src="/logo.svg"
                      alt="Logo"
                      width={120}
                      height={120}
                      className={styles.emptyLogo}
                    />
                  </div>
                ) : (
                  <Slider>
                    {slides.map((slide) => (
                      <Image
                        key={slide.id}
                        src={imgSrc(slide.image_url)}
                        alt={slide.title}
                        width={640}
                        height={280}
                      />
                    ))}
                  </Slider>
                )}
              </div>

              {/* —— Produtos da categoria destaque —— */}
              <div className={styles.electronicsBox}>
                <header className={styles.sectionHeader}>
                  <h2>{featuredCategory?.name ?? 'Eletrônicos'}</h2>
                  <Icons.ArrowRight
                    size={20}
                    onClick={() => {
                      if (featuredCategory) {
                        handleCategoryClick(
                          featuredCategory.id,
                          featuredCategory.name,
                        );
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                </header>

                <div ref={gridRef} className={styles.productsGrid}>
                  {electronics.items
                    .slice(0, visibleCount)
                    .map((p) => (
                      <div
                        key={p.id}
                        className={styles.productCard}
                        onClick={() => {
                          setSelectedProductId(p.id);
                          setModalOpen(true);
                        }}
                      >
                        <Image
                          src={imgSrc(p.image_url)}
                          alt={p.name}
                          width={100}
                          height={100}
                          className={styles.electronicsImage}
                        />
                        <p
                          className={`${styles.prodName} ${styles.truncateTwoLines}`}
                        >
                          {p.name}
                        </p>
                        <p className={styles.prodCost}>{p.points_cost} pts</p>
                        <button
                          className={styles.resgatarBtn}
                          disabled={balance < p.points_cost}
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
                          {balance >= p.points_cost ? 'Resgatar' : 'Sem pontos'}
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </section>

            {/* ========== Destaques ========== */}
            <section ref={highlightRef} className={styles.bottomRow}>
              {featuredProducts
                .slice(0, visibleHighlights)
                .map((p) => (
                  <div
                    key={p.id}
                    className={styles.highlightCard}
                    onClick={() => {
                      setSelectedProductId(p.id);
                      setModalOpen(true);
                    }}
                  >
                    <Image
                      src={imgSrc(p.image_url)}
                      alt={p.name}
                      width={180}
                      height={180}
                    />
                    <p
                      className={`${styles.highlightName} ${styles.truncateTwoLines}`}
                    >
                      {p.name}
                    </p>
                    <span>{p.points_cost} pts</span>
                    <button
                      className={styles.resgatarBtn}
                      disabled={balance < p.points_cost}
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
                      {balance >= p.points_cost ? 'Resgatar' : 'Sem pontos'}
                    </button>
                  </div>
                ))}
            </section>
          </main>

          {/* —————————————————— Painel direito + lista extra —————————————————— */}
          <div className={styles.twoSection}>
            <aside className={styles.panel}>
              {user && (
                <div className={styles.userInfo}>
                  <Icons.User className={styles.userIcon} />
                  <div>
                    <p>
                      Olá, <strong>{user.name}</strong>
                    </p>
                    <p>
                      Saldo: <strong>{balance} pts</strong>
                    </p>
                  </div>
                </div>
              )}

              <div className={styles.actions}>
                <button
                  className={styles.iconButton}
                  onClick={() => (window.location.href = '/store/cart')}
                >
                  <Icons.ShoppingCart />
                  {cartCount > 0 && (
                    <span className={styles.badge}>{cartCount}</span>
                  )}
                </button>
                <button
                  className={styles.iconButton}
                  onClick={() => (window.location.href = '/store/orders')}
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

            {/* Sidebar extra (7 categorias) */}
            <aside className={styles.sidebarTwo}>
              <ul className={styles.categoryList}>
                {(showAllCats ? categories : categories.slice(0, 7)).map(
                  (cat) => {
                    const Icon = getIconBySlug(cat.slug);
                    return (
                      <li key={cat.id} className={styles.categoryItem} onClick={() => handleCategoryClick(cat.id, cat.name)}>
                        <Icon />
                        <span>{cat.name}</span>
                      </li>
                    );
                  },
                )}
                {categories.length > 7 && (
                  <li
                  className={styles.showAllItem}
                  onClick={() => setCatModalOpen(true)}
                >
                  Ver todos
                </li>
                )}
              </ul>
            </aside>
          </div>
        </div>

        {/* —————————————————— Listagens de produtos (all / categoria) —————————————————— */}
        {selectedCategoryId ? (
          <section className={styles.allProductsSection}>
            <h2 className={styles.allProductsHeader}>
              Produtos em “{selectedCategoryName}”
              <button
                className={styles.clearFilter}
                onClick={clearCategory}
              >
                ×
              </button>
            </h2>

            <div className={styles.productsGridAll}>
              {catProducts.items.map((p) => (
                <div
                  key={p.id}
                  className={styles.productCardAll}
                  onClick={() => {
                    setSelectedProductId(p.id);
                    setModalOpen(true);
                  }}
                >
                  <Image
                    src={imgSrc(p.image_url)}
                    alt={p.name}
                    width={160}
                    height={160}
                  />
                  <p className={styles.prodName}>{p.name}</p>
                  <p className={styles.prodCost}>{p.points_cost} pts</p>
                  <button
                    className={styles.resgatarBtn}
                    disabled={balance < p.points_cost}
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
                    {balance >= p.points_cost ? 'Resgatar' : 'Sem pontos'}
                  </button>
                </div>
              ))}
            </div>

            {totalPagesCat > 1 && (
              <div className={styles.paginationAll}>
                {Array.from({ length: totalPagesCat }).map((_, i) => (
                  <button
                    key={i}
                    className={
                      skipCat / limit === i ? styles.pageAllActive : ''
                    }
                    onClick={() => setSkipCat(i * limit)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className={styles.allProductsSection}>
            <h2 className={styles.allProductsHeader}>Todos os produtos</h2>

            <div className={styles.productsGridAll}>
              {allProducts.items.map((p) => (
                <div
                  key={p.id}
                  className={styles.productCardAll}
                  onClick={() => {
                    setSelectedProductId(p.id);
                    setModalOpen(true);
                  }}
                >
                  <Image
                    src={imgSrc(p.image_url)}
                    alt={p.name}
                    width={160}
                    height={160}
                  />
                  <p className={styles.prodName}>{p.name}</p>
                  <p className={styles.prodCost}>{p.points_cost} pts</p>
                  <button
                    className={styles.resgatarBtn}
                    disabled={balance < p.points_cost}
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
                    className={
                      skipAll / limit === i ? styles.pageAllActive : ''
                    }
                    onClick={() => setSkipAll(i * limit)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Modais */}
      <ProductDetailModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        productId={selectedProductId}
      />
      <CategoryListModal
        open={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        onSelectCategory={handleCategoryClick}
      />
    </>
  );
}

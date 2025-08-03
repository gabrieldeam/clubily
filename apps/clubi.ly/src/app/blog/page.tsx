'use client';

import React, { useState, useEffect } from 'react';
import Slider from '@/components/Slider/Slider';
import Image from 'next/image';
import { fetchBanners } from '@/services/bannerService';
import { Banner } from '@/types/banner';
import { fetchPosts } from '@/services/postService';
import PostCard from '@/components/blog/PostCard/PostCard';
import { fetchCategories } from '@/services/categoryBlogService';
import CategorySection from '@/components/blog/CategorySection/CategorySection';
import { Category } from '@/types/categoryBlog';
import { Search } from 'lucide-react';
import styles from './page.module.css';

export default function BlogPage() {
  /* Banners */
  const [slides, setSlides] = useState<Banner[]>([]);
  const [loadingSlides, setLoadingSlides] = useState(true);

  /* Posts */
  const [initialPosts, setInitialPosts] = useState<any[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const [displayedPosts, setDisplayedPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  /* Categorias */
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  /* Estado de categoria selecionada */
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  /* Responsividade */
  const [isMobile, setIsMobile] = useState(false);

  /* Paginação */
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 8;

  /* Busca */
  const [searchQuery, setSearchQuery] = useState('');

  /* Detecta mobile */
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /* Fetch inicial */
  useEffect(() => {
    fetchBanners()
      .then(data => setSlides(data))
      .finally(() => setLoadingSlides(false));

    fetchPosts({ page_size: 10 })
      .then(data => {
        const items = Array.isArray(data) ? data : (data as any).items || [];
        setInitialPosts(items);
        setDisplayedPosts(items);
      })
      .finally(() => {
        setLoadingInitial(false);
        setLoadingPosts(false);
      });

    fetchCategories()
      .then(data => setCategories(data))
      .finally(() => setLoadingCategories(false));
  }, []);

  /* Helper para imagens */
  const imgSrc = (url: string) =>
    url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_API_URL}${url}`;

  /* Paginação calculada */
  const totalPages = Math.ceil(displayedPosts.length / postsPerPage);
  const paginatedPosts = displayedPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  /* Handlers de paginação */
  const handlePrevPage = () => setCurrentPage(p => Math.max(p - 1, 1));
  const handleNextPage = () => setCurrentPage(p => Math.min(p + 1, totalPages));

  /* Busca por texto */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    setLoadingPosts(true);

    fetchPosts({ page_size: 100, q })
      .then(data => {
        const items = Array.isArray(data) ? data : (data as any).items || [];
        setDisplayedPosts(items);
        setCurrentPage(1);
      })
      .finally(() => setLoadingPosts(false));
  };

  /**
   * Seleciona uma categoria (ou todas, se null) e recarrega posts.
   */
  const handleCategorySelect = (categoryId: string | null): void => {
    setSelectedCategoryId(categoryId);
    setSearchQuery('');
    setCurrentPage(1);
    setLoadingPosts(true);

    // Monta params dinamicamente
    const params: Record<string, any> = { page_size: 100 };
    if (categoryId) params.category_id = categoryId;

    fetchPosts(params)
      .then(data => {
        const items = Array.isArray(data) ? data : (data as any).items || [];
        setDisplayedPosts(items);
      })
      .catch(console.error)
      .finally(() => setLoadingPosts(false));
  };

  return (
    <main className={styles.main}>
      {/* Top row: slider + destaques */}
      <section className={styles.topRow}>
        <div className={styles.sliderBox}>
          {loadingSlides ? (
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
            <Slider interval={5000}>
              {slides.map(slide => (
                <div key={slide.id} className="slideContainer">
                  <Image
                    src={imgSrc(slide.image_url)}
                    alt={slide.title}
                    fill
                    style={{ objectFit: 'cover' }}
                    priority
                    unoptimized
                  />
                </div>
              ))}
            </Slider>
          )}
        </div>

        <div className={styles.electronicsBox}>
          {loadingInitial ? (
            <p>Carregando...</p>
          ) : (
            initialPosts.slice(0, isMobile ? 1 : 2).map(post => (
              <PostCard key={post.id} post={post} />
            ))
          )}
        </div>
      </section>

      {/* Sidebar (busca + categorias) e lista paginada */}
      <section className={styles.categoryPostsSection}>
        <aside className={styles.sidebar}>
          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Buscar posts..."
              className={styles.searchInput}
            />
          </div>

          {loadingCategories ? (
            <p>Carregando categorias...</p>
          ) : (
            <CategorySection
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={handleCategorySelect}
            />
          )}
        </aside>

        <div className={styles.postList}>
          {loadingPosts ? (
            <p>Carregando posts...</p>
          ) : (
            <>
              {paginatedPosts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
              <div className={styles.pagination}>
                <button onClick={handlePrevPage} disabled={currentPage === 1}>
                  Anterior
                </button>
                <span>
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

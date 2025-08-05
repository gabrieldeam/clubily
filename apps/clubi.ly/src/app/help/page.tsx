// src/app/help/page.tsx
'use client'

import { useEffect, useState, FormEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import PostCard from '@/components/help/HelpPostCard/HelpPostCard'
import { helpImages } from '@/constants/helpImages'
import {
  fetchHelpCategoryTree,
  fetchHelpPostsByCategoryTree,
  fetchHelpPosts,
} from '@/services/help'
import type { HelpCategory, HelpPost } from '@/types/help'
import styles from './page.module.css'

export default function HelpCenterPage() {
  const [categories, setCategories] = useState<HelpCategory[]>([])
  const [categoryPosts, setCategoryPosts] = useState<Record<string, HelpPost[]>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [searched, setSearched] = useState(false)
  const [posts, setPosts] = useState<HelpPost[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchHelpCategoryTree()
      .then(cats => {
        setCategories(cats)
        cats.forEach(cat => {
          fetchHelpPostsByCategoryTree(cat.id, 5)
            .then(posts => {
              setCategoryPosts(prev => ({ ...prev, [cat.id]: posts }))
            })
            .catch(err => console.error(err))
        })
      })
      .catch(err => console.error(err))
  }, [])

  async function handleSearch(e: FormEvent) {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) {
      setSearched(false)
      return
    }

    setLoading(true)
    try {
      const { items } = await fetchHelpPosts({ page: 1, page_size: 100, search: q })
      setPosts(items)
      setSearched(true)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function handleClear() {
    setSearchQuery('')
    setSearched(false)
    setPosts([])
  }

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        {/* Hero shapes omitted for brevity */}
        <div className={styles.heroText}>
          <h1>Central de Ajuda</h1>
          <p>Descubra as perguntas mais frequentes de clientes e empresas parceiros.</p>
        </div>
        <form onSubmit={handleSearch} className={styles.heroSearch}>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar na ajuda..."
            className={styles.searchInput}
          />
          {searched && (
            <button
              type="button"
              aria-label="Limpar busca"
              className={styles.clearButton}
              onClick={handleClear}
            >
              &times;
            </button>
          )}
          <button type="submit" className={styles.searchButton} disabled={loading}>
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </form>
      </div>

      {searched ? (
        posts.length > 0 ? (
          <div className={styles.searchResults}>
            {posts.map(post => <PostCard key={post.id} post={post} />)}
          </div>
        ) : (
          <p className={styles.noResults}>Nenhum resultado para “{searchQuery}”</p>
        )
      ) : (
        categories.map((category, idx) => {
          const imgSrc = helpImages[idx % helpImages.length]
          return (
            <section key={category.id} className={styles.categorySection}>
              <div className={styles.categorySectionContent}>
                <div className={styles.categoryImage}>
                  <Image
                    src={imgSrc}
                    alt={category.name}
                    fill
                    className={styles.image}
                    style={{ objectFit: 'cover' }}
                    priority
                  />
                </div>
                <div className={styles.categoryInfo}>
                  <h2 className={styles.categoryTitle}>{category.name}</h2>

                  {categoryPosts[category.id]?.length ? (
                    <ul className={styles.subcategoriesList}>
                      {categoryPosts[category.id].map(post => (
                        <li key={post.id} className={styles.subcategoryItem}>
                          <Link href={`/help/article/${post.slug}`}>{post.title}</Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.noPosts}>Nenhum artigo disponível.</p>
                  )}

                  <div className={styles.viewAll}>
                    <Link href={`/help/category/${category.id}`}>
                      <button className={styles.categoryButton}>Ver todos</button>
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          )
        })
      )}
    </div>
  )
}
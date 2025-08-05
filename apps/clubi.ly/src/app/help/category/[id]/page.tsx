// src/app/help/category/[id]/page.tsx
import Link from 'next/link'
import HelpPostCard from '@/components/help/HelpPostCard/HelpPostCard'
import { fetchHelpCategoryFullTree } from '@/services/help'
import styles from './page.module.css'

export default async function HelpCategoryPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  // Busca a árvore completa da categoria (inclui posts e subcategorias)
  const categoryTree = await fetchHelpCategoryFullTree(id)

  // Posts da categoria atual
  const posts = categoryTree.posts ?? []

  // Filtra apenas subcategorias que tenham ao menos 1 post
  const subcatsWithPosts = (categoryTree.children ?? []).filter(
    child => Array.isArray(child.posts) && child.posts.length > 0
  )

  return (
    <div className={styles.container}>
      {/* Cabeçalho */}
      <header className={styles.header}>
        <h1 className={styles.title}>{categoryTree.name}</h1>
      </header>

      <main>
        {/* 1️⃣ Se houver posts na categoria principal */}
        {posts.length > 0 && (
          <section className={styles.section}>
            <div className={styles.postsGrid}>
              {posts.map(post => (
                <HelpPostCard key={post.id} post={post} />
              ))}
            </div>
          </section>
        )}

        {/* 2️⃣ Para cada subcategoria que tenha posts */}
        {subcatsWithPosts.map(child => {
          const childPosts = child.posts!

          return (
            <section key={child.id} className={styles.section}>
              <h3 className={styles.subSectionTitle}>
                <Link
                  href={`/help/category/${child.id}`}
                  className={styles.subcatLink}
                >
                  {child.name}
                </Link>
              </h3>

              <div className={styles.postsGrid}>
                {childPosts.map(post => (
                  <HelpPostCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          )
        })}

        {/* 3️⃣ Se não houver nada para mostrar */}
        {posts.length === 0 && subcatsWithPosts.length === 0 && (
          <p className={styles.emptyMessage}>
            Nenhum artigo encontrado nesta categoria nem em suas subcategorias.
          </p>
        )}
      </main>
    </div>
  )
}

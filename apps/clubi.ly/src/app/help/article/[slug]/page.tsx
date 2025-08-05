// src/app/help/article/[slug]/page.tsx
import Image from 'next/image'
import { fetchHelpPostBySlug } from '@/services/help'
import { HelpPost } from '@/types/help'
import ShareButtons from './ShareButtons'
import styles from './page.module.css'

export default async function HelpPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  // params agora é Promise<{ slug: string }>
  const { slug } = await params
  const post: HelpPost = await fetchHelpPostBySlug(slug)

  return (
    <div className={styles.container}>
      <article className={styles.postContainer}>
        <header className={styles.postHeader}>
          <h1>{post.title}</h1>
          <div className={styles.postMeta}>
            <span>{new Date(post.created_at).toLocaleDateString('pt-BR')}</span>
          </div>
          <div className={styles.postCategories}>
            {post.categories.map(cat => (
              <span key={cat.id} className={styles.categoryTag}>
                {cat.name}
              </span>
            ))}
          </div>
          <div className={styles.postShare}>
            <p>Compartilhar</p>
            <ShareButtons />
          </div>
        </header>

        <div className={styles.postContent}>
          {post.blocks
            .sort((a, b) => a.position - b.position)
            .map(block => {
              if (block.type === 'text') {
                return (
                  <div
                    key={block.id}
                    className={styles.contentBlock}
                    dangerouslySetInnerHTML={{
                      __html:
                        typeof block.content === 'string'
                          ? block.content
                          : block.content.html,
                    }}
                  />
                )
              }

              if (block.type === 'image') {
                const img = block.content
                return (
                  <figure key={block.id} className={styles.contentBlock}>
                    <Image
                      src={img.url}
                      alt="Imagem do artigo"
                      width={800}
                      height={600}
                      className="object-contain"
                    />
                    {img.caption && <figcaption>{img.caption}</figcaption>}
                  </figure>
                )
              }

              return null
            })}
        </div>
      </article>
    </div>
  )
}

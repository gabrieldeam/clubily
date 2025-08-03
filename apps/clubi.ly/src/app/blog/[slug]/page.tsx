import { fetchPostBySlug as fetchPost } from '@/services/postService'
import Image from 'next/image'
import styles from './page.module.css'
import ShareButtons from './ShareButtons'

export default async function PostPage({
  params
}: {
  params: { slug: string }
}) {
  const post = await fetchPost(params.slug)

  return (
    <div className={styles.container}>
      <article className={styles.postContainer}>
        {post.thumbnail_url && (
          <div className={styles.postHeaderImage}>
            <Image
              src={post.thumbnail_url}
              alt={post.title}
              fill
              className="object-cover"
            />
          </div>
        )}

        <header className={styles.postHeader}>
          <h1>{post.title}</h1>
          <div className={styles.postMeta}>
            <span>Por {post.author.name}</span>
            <span>{new Date(post.created_at).toLocaleDateString()}</span>
          </div>
          <div className={styles.postCategories}>
            {post.categories.map(category => (
              <span key={category.id} className={styles.categoryTag}>
                {category.name}
              </span>
            ))}
          </div>
          {/* ─── botões de compartilhamento ─── */}
          <div className={styles.postShare}>
            <p>Compartilhar</p>
            <ShareButtons />
          </div>
        </header>

        <div className={styles.postContent}>
          {post.blocks
            .sort((a, b) => a.position - b.position)
            .map(block => (
              <div key={block.id} className={styles.contentBlock}>
                {block.type === 'text' && (
                  <div dangerouslySetInnerHTML={{ __html: block.content }} />
                )}
                {block.type === 'image' && (
                  <Image
                    src={block.content}
                    alt="Imagem do post"
                    width={800}
                    height={600}
                    className="object-contain"
                  />
                )}
                {block.type === 'video' && (
                  <div className={styles.videoContainer}>
                    <video controls src={block.content} />
                  </div>
                )}
              </div>
            ))}
        </div>
      </article>
    </div>
  )
}

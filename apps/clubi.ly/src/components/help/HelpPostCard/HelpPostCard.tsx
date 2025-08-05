// src/components/help/HelpPostCard/HelpPostCard.tsx
import Link from 'next/link'
import { HelpPost } from '@/types/help'
import styles from './HelpPostCard.module.css'

export default function HelpPostCard({ post }: { post: HelpPost }) {
  return (
    <div className={styles.card}>
      <div className={styles.content}>
        <h3 className={styles.title}>
          <Link href={`/help/article/${post.slug}`}>{post.title}</Link>
        </h3>
        <div className={styles.meta}>
          <span>
            Atualizado em:{" "}
            {new Date(post.updated_at).toLocaleDateString("pt-BR")}
          </span>
        </div>

        {/* Só tenta mapear se existir */}
        <div className={styles.categories}>
          {post.categories?.map((category) => (
            <span key={category.id} className={styles.category}>
              {category.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// src/components/blog/PostCard/PostCard.tsx
import Image from 'next/image';
import Link from 'next/link';
import { Post } from '@/types/post';
import styles from './PostCard.module.css';

/**
 * Resolve o caminho da imagem, suportando:
 * - Base64 (data URI)
 * - URLs absolutas (http/https)
 * - Caminhos relativos (prefixados com NEXT_PUBLIC_API_URL)
 */
function resolveUrl(path: string): string {
  if (path.startsWith('data:')) {
    return path;
  }
  if (path.startsWith('http')) {
    return path;
  }
  const base = process.env.NEXT_PUBLIC_API_URL || '';
  // Garante exatamente uma barra entre base e path
  const prefix = base.endsWith('/') ? base.slice(0, -1) : base;
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${prefix}/${cleanPath}`;
}

export default function PostCard({ post }: { post: Post }) {
  // Primeiro bloco de imagem (pode ser base64)
  const imageBlock = post.blocks.find((b) => b.type === 'image');
  // Primeiro bloco de texto para o trecho inicial
  const textBlock = post.blocks.find((b) => b.type === 'text');

  // Determina a URL final para o componente Image
  const imgUrl = imageBlock
    ? resolveUrl(imageBlock.content)
    : post.thumbnail_url
    ? resolveUrl(post.thumbnail_url)
    : '';

  return (
    <div className={styles.postCard}>
      {imgUrl && (
        <div className={styles.postImage}>
          <Image
            src={imgUrl}
            alt={post.title}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className={styles.postContent}>
        <h3 className={styles.postTitle}>
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>

        <div className={styles.postMeta}>
          <span>{new Date(post.created_at).toLocaleDateString()}</span>
          <span>por {post.author.name}</span>
        </div>

        {textBlock && (
          <p className={styles.postExcerpt}>
            {textBlock.content.length > 100
              ? textBlock.content.slice(0, 100).trim() + '...'
              : textBlock.content}
          </p>
        )}

        <div className={styles.postCategories}>
          {post.categories.map((category) => (
            <span key={category.id} className={styles.categoryTag}>
              {category.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
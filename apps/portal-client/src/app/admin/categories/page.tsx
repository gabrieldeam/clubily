'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { listCategories } from '@/services/categoryService';
import type { CategoryRead } from '@/types/category';
import styles from './styles.module.css';

export default function CategoriesListPage() {
  const [cats, setCats] = useState<CategoryRead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listCategories()
      .then(res => setCats(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Carregando categorias...</p>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Categorias</h1>
        <Link href="/admin/categories/create">
          <button className={styles.button}>Nova Categoria</button>
        </Link>
      </header>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Imagem</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {cats.map(cat => (
            <tr key={cat.id}>
              <td>{cat.name}</td>
              <td>
                <Image
                  src={`${process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL}${cat.image_url ?? ''}`}
                  alt={cat.name}
                  width={50}
                  height={50}
                  className={styles.thumb}
                />
              </td>
              <td>
                <Link href={`/admin/categories/${cat.id}`}>
                  <button className={styles.button}>Editar</button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
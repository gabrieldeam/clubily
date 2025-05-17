'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createCategory } from '@/services/categoryService';
import type { CategoryCreate } from '@/types/category';
import styles from '../styles.module.css';

export default function CreateCategoryPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!image) { setError('Selecione uma imagem.'); return; }

    try {
      const payload: CategoryCreate = { name, image };
      await createCategory(payload);
      router.push('/admin/categories');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao criar.');
    }
  };

  return (
    <div className={styles.container}>
      <h1>Nova Categoria</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <p className={styles.error}>{error}</p>}
        <label>
          Nome
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </label>
        <label>
          Imagem
          <input
            type="file"
            accept="image/*"
            onChange={e => setImage(e.target.files?.[0] ?? null)}
            required
          />
        </label>
        <div className={styles.actions}>
          <button type="submit" className={styles.button}>Criar</button>
        </div>
      </form>
    </div>
  );
}
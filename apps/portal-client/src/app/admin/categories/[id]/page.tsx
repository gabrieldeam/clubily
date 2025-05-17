'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { listCategories, updateCategory } from '@/services/categoryService';
import type { CategoryRead, CategoryUpdate } from '@/types/category';
import styles from '../styles.module.css';

export default function EditCategoryPage() {
  const params = useParams();
  // Garante que id seja string
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const [cat, setCat] = useState<CategoryRead | null>(null);
  const [name, setName] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    listCategories()
      .then(res => {
        const found = res.data.find(c => c.id === id);
        if (found) {
          setCat(found);
          setName(found.name);
        }
      });
  }, [id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      const payload: Partial<CategoryUpdate> = { name };
      if (image) payload.image = image;
      await updateCategory(id, payload as any);
      router.push('/admin/categories');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao editar.');
    }
  };

  if (!cat) return <p>Carregando...</p>;
  if (!id) return <p>ID inválido</p>;

  return (
    <div className={styles.container}>
      <h1>Editar Categoria</h1>
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
          Imagem (opcional)
          <input
            type="file"
            accept="image/*"
            onChange={e => setImage(e.target.files?.[0] ?? null)}
          />
        </label>
        <div className={styles.actions}>
          <button type="submit" className={styles.button}>Salvar</button>
        </div>
      </form>
    </div>    
  );
}
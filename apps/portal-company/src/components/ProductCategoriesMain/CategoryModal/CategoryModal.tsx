// /components/ProductCategoriesMain/CategoryModal/CategoryModal.tsx
'use client';

import { FormEvent, useState, useEffect, useRef } from 'react';
import styles from './CategoryModal.module.css';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import Button from '@/components/Button/Button';
import Notification from '@/components/Notification/Notification';
import type { ProductCategoryRead, ProductCategoryCreate } from '@/types/productCategory';
import { slugify, validateSlug } from '@/utils/slug';

interface Props {
  category: ProductCategoryRead | null;
  onSave: (data: ProductCategoryCreate, id?: string) => void;
  onCancel: () => void;
}

export default function CategoryModal({ category, onSave, onCancel }: Props) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [notification, setNotification] =
    useState<{ type: 'error'; message: string } | null>(null);
  const slugTouched = useRef(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setSlug(category.slug);
      slugTouched.current = true;
    } else {
      setName('');
      setSlug('');
      slugTouched.current = false;
      setNotification(null);
    }
  }, [category]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setName(v);
    if (!slugTouched.current) setSlug(slugify(v));
  };
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    slugTouched.current = true;
    setSlug(e.target.value);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNotification({ type: 'error', message: 'O nome é obrigatório.' });
      return;
    }
    if (!slug.trim() || !validateSlug(slug)) {
      setNotification({
        type: 'error',
        message: 'Slug inválido. Use apenas letras minúsculas, números e hífens.',
      });
      return;
    }
    onSave({ name: name.trim(), slug }, category?.id);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.title}>
        {category ? 'Editar Categoria' : 'Nova Categoria'}
      </h2>

      {notification && (
        <Notification
          type="error"
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <FloatingLabelInput
        id="cat-name"
        label="Nome"
        value={name}
        onChange={handleNameChange}
      />

      <FloatingLabelInput
        id="cat-slug"
        label="Slug"
        value={slug}
        onChange={handleSlugChange}
      />
      <div className={styles.helperText}>somente a–z, 0–9 e hífens</div>

      <div className={styles.actions}>
        <Button type="submit">{category ? 'Salvar' : 'Criar'}</Button>
        <Button bgColor="#AAA" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
);
}

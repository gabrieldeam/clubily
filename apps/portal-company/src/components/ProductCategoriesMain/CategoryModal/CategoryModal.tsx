'use client';

import { FormEvent, useState, useEffect } from 'react';
import styles from './CategoryModal.module.css';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import Button from '@/components/Button/Button';
import Notification from '@/components/Notification/Notification';
import type { ProductCategoryRead, ProductCategoryCreate } from '@/types/productCategory';
import { slugify } from '@/utils/slug';

interface Props {
  category: ProductCategoryRead | null;
  onSave: (data: ProductCategoryCreate, id?: string) => void;
  onCancel: () => void;
}

const DRAFT_KEY = 'categoryModalDraft';

export default function CategoryModal({ category, onSave, onCancel }: Props) {
  const [name, setName] = useState('');
  const [notification, setNotification] =
    useState<{ type: 'error'; message: string } | null>(null);

  // 1) Inicialização / Restauração do draft
  useEffect(() => {
    if (category) {
      setName(category.name);
    } else {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        try {
          const { name: n } = JSON.parse(draft);
          setName(n ?? '');
        } catch {
          setName('');
        }
      } else {
        setName('');
      }
      setNotification(null);
    }
  }, [category]);

  // 2) Salvamento automático do draft (só o nome)
  useEffect(() => {
    if (!category) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ name: name.trim() }));
    }
  }, [name, category]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const cleanName = name.trim();
    if (!cleanName) {
      setNotification({ type: 'error', message: 'O nome é obrigatório.' });
      return;
    }

    // 3) Gera o slug em background a partir do nome
    const baseSlug = slugify(cleanName);

    if (!baseSlug) {
      setNotification({
        type: 'error',
        message: 'Não conseguimos gerar um slug a partir do nome. Tente um nome diferente.',
      });
      return;
    }


    const finalSlug = baseSlug;

    onSave({ name: cleanName, slug: finalSlug }, category?.id);
    if (!category) localStorage.removeItem(DRAFT_KEY);
  };

  const handleCancel = () => {
    if (!category) localStorage.removeItem(DRAFT_KEY);
    onCancel();
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
        label="Nome da categoria"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className={styles.actions}>
        <Button type="submit">{category ? 'Salvar' : 'Criar'}</Button>
        <Button bgColor="#AAA" onClick={handleCancel}>Cancelar</Button>
      </div>
    </form>
  );
}


// /components/BranchesMain/BranchModal/BranchModal.tsx
'use client';

import { FormEvent, useState, useEffect, useRef } from 'react';
import styles from './BranchModal.module.css';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import Button from '@/components/Button/Button';
import Notification from '@/components/Notification/Notification';
import type { BranchRead, BranchCreate } from '@/types/branch';
import { slugify, validateSlug } from '@/utils/slug';

interface Props {
  branch: BranchRead | null;
  onSave: (data: BranchCreate, id?: string) => void;
  onCancel: () => void;
}

export default function BranchModal({ branch, onSave, onCancel }: Props) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [notification, setNotification] =
    useState<{ type: 'error'; message: string } | null>(null);
  const slugTouched = useRef(false);

  useEffect(() => {
    if (branch) {
      setName(branch.name);
      setSlug(branch.slug);
      slugTouched.current = true;
    } else {
      setName('');
      setSlug('');
      slugTouched.current = false;
      setNotification(null);
    }
  }, [branch]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setName(v);
    if (!slugTouched.current) {
      setSlug(slugify(v));
    }
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
        message:
          'Slug inválido. Use apenas letras minúsculas, números e hífens.',
      });
      return;
    }

    onSave({ name: name.trim(), slug }, branch?.id);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.title}>
        {branch ? 'Editar Filial' : 'Nova Filial'}
      </h2>

      {notification && (
        <Notification
          type="error"
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <FloatingLabelInput
        id="branch-name"
        label="Nome"
        value={name}
        onChange={handleNameChange}
      />

      <FloatingLabelInput
        id="branch-slug"
        label="Slug"
        value={slug}
        onChange={handleSlugChange}
      />
      <div className={styles.helperText}>
        somente a–z, 0–9 e hífens
      </div>

      <div className={styles.actions}>
        <Button type="submit">{branch ? 'Salvar' : 'Criar'}</Button>
        <Button bgColor="#AAA" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

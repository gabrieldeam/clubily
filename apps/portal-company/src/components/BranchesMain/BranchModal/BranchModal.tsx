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

const DRAFT_KEY = 'branchModalDraft';

export default function BranchModal({ branch, onSave, onCancel }: Props) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [notification, setNotification] =
    useState<{ type: 'error'; message: string } | null>(null);
  const slugTouched = useRef(false);
  const isFirstRun = useRef(true);

  // 1) Restauração do rascunho ou init
  useEffect(() => {
    if (branch) {
      setName(branch.name);
      setSlug(branch.slug);
      slugTouched.current = true;
    } else {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        const { name: dn, slug: ds } = JSON.parse(draft);
        setName(dn);
        setSlug(ds);
        slugTouched.current = true;
      } else {
        setName('');
        setSlug('');
        slugTouched.current = false;
      }
      setNotification(null);
    }
  }, [branch]);

  // 2) Salvamento automático do rascunho
  useEffect(() => {
    if (branch) return;
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (name.trim() !== '' || slug.trim() !== '') {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ name: name.trim(), slug: slug.trim() })
      );
    }
  }, [name, slug, branch]);

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

  // 3) Salvamento final e limpeza do draft
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
    onSave({ name: name.trim(), slug: slug.trim() }, branch?.id);
    if (!branch) localStorage.removeItem(DRAFT_KEY);
  };

  // 4) Cancelar e limpar draft
  const handleCancel = () => {
    if (!branch) localStorage.removeItem(DRAFT_KEY);
    onCancel();
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
        label="Nome da filial"
        value={name}
        onChange={handleNameChange}
      />

      <FloatingLabelInput
        id="branch-slug"
        label="Nome simples"
        value={slug}
        onChange={handleSlugChange}
      />
      <div className={styles.helperText}>
        somente a–z, 0–9 e hífens
      </div>

      <div className={styles.actions}>
        <Button type="submit">{branch ? 'Salvar' : 'Criar'}</Button>
        <Button bgColor="#AAA" onClick={handleCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

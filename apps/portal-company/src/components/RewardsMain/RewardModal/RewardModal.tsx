// src/components/RewardModal/RewardModal.tsx
'use client';

import { FormEvent, useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './RewardModal.module.css';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import Button from '@/components/Button/Button';
import Notification from '@/components/Notification/Notification';
import type { RewardRead, RewardCreate } from '@/types/companyReward';
import { getImageUrl } from '@/utils/getImageUrl';

interface Props {
  reward: RewardRead | null;
  onSave: (data: RewardCreate, id?: string) => void;
  onCancel: () => void;
}

export default function RewardModal({ reward, onSave, onCancel }: Props) {
  // ─── Campos do formulário ─────────────────────────────────────
  const [name, setName] = useState('');
  const [description, setDescription] = useState<string | undefined>('');
  const [secret, setSecret] = useState(false);
  const [stock, setStock] = useState<number | undefined>(undefined);
  const [image, setImage] = useState<File | null>(null);

  // ─── UI/estado auxiliar ───────────────────────────────────────
  const [preview, setPreview] = useState<string | undefined>(undefined);
  const [notification, setNotification] = useState<
    { type: 'error'; message: string } | null
  >(null);

  // ─── Carrega valores quando abre modal (create | edit) ────────
  useEffect(() => {
    if (reward) {
      setName(reward.name);
      setDescription(reward.description ?? '');
      setSecret(reward.secret);
      setStock(reward.stock_qty ?? undefined);
      setImage(null);
      setPreview(getImageUrl(reward.image_url) ?? undefined);
    } else {
      setName('');
      setDescription('');
      setSecret(false);
      setStock(undefined);
      setImage(null);
      setPreview(undefined);
    }
    setNotification(null);
  }, [reward]);

  // ─── Manipulador de arquivo ───────────────────────────────────
  const handleFile = (file: File | null) => {
    setImage(file);
    if (file) {
      setPreview(URL.createObjectURL(file));
    } else if (reward?.image_url) {
      setPreview(getImageUrl(reward.image_url) ?? undefined);
    } else {
      setPreview(undefined);
    }
  };

  // ─── Envio do formulário ──────────────────────────────────────
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNotification({ type: 'error', message: 'O nome é obrigatório.' });
      return;
    }
    onSave(
      {
        name: name.trim(),
        description: description?.trim() || undefined,
        secret,
        stock_qty: stock,
        image: image ?? undefined,
      },
      reward?.id,
    );
  };

  // ─── Render ───────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.title}>
        {reward ? 'Editar Recompensa' : 'Nova Recompensa'}
      </h2>

      {notification && (
        <Notification
          type="error"
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <FloatingLabelInput
        id="reward-name"
        label="Nome"
        value={name}
        onChange={e => setName(e.target.value)}
        required
      />

      <div className={styles.fieldGroup}>
        <label htmlFor="reward-desc" className={styles.label}>
          Descrição (opcional)
        </label>
        <textarea
          id="reward-desc"
          className={styles.textarea}
          rows={3}
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>

      <div className={styles.switches}>
        <label>
          <input
            type="checkbox"
            checked={secret}
            onChange={e => setSecret(e.target.checked)}
          />{' '}
          Secreto
        </label>
      </div>

      <FloatingLabelInput
        id="reward-stock"
        label="Estoque (opcional)"
        type="number"
        value={stock ?? ''}
        onChange={e =>
          setStock(e.target.value === '' ? undefined : Number(e.target.value))
        }
      />

      <div className={styles.fieldGroup}>
        <label className={styles.fileLabel}>
          Ícone / Imagem (opcional)
          <input
            type="file"
            accept="image/*"
            onChange={e => handleFile(e.target.files?.[0] ?? null)}
          />
        </label>

        {preview && (
          <Image
            src={preview}
            alt="Pré-visualização"
            fill
            className={styles.preview}
          />
        )}
      </div>

      <div className={styles.actions}>
        <Button type="submit">{reward ? 'Salvar' : 'Criar'}</Button>
        <Button bgColor="#AAA" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

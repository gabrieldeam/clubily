// src/components/RewardModal/RewardModal.tsx
'use client';

import { FormEvent, useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from './RewardModal.module.css';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import Button from '@/components/Button/Button';
import Notification from '@/components/Notification/Notification';
import type { RewardRead, RewardCreate } from '@/types/companyReward';
import { getImageUrl } from '@/utils/getImageUrl';

// 👉 novo: picker/cropper 1:1
import ImagePickerSquare from '@/components/ImagePickerSquare/ImagePickerSquare';

interface Props {
  reward: RewardRead | null;
  onSave: (data: RewardCreate, id?: string) => void;
  onCancel: () => void;
}

const DRAFT_KEY = 'rewardModalDraft';

export default function RewardModal({ reward, onSave, onCancel }: Props) {
  // campos do formulário
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [secret, setSecret] = useState(false);
  const [stock, setStock] = useState<number | undefined>(undefined);
  const [image, setImage] = useState<File | null>(null);

  // UI/estado auxiliar
  const [preview, setPreview] = useState<string | undefined>(undefined);
  const [notification, setNotification] = useState<{ type: 'error'; message: string } | null>(null);

  const isFirstRun = useRef(true);

  // 1) inicialização / restauração do rascunho
  useEffect(() => {
    if (reward) {
      setName(reward.name);
      setDescription(reward.description ?? '');
      setSecret(reward.secret);
      setStock(reward.stock_qty ?? undefined);
      setImage(null);
      setPreview(getImageUrl(reward.image_url) ?? undefined);
    } else {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        const { name: dn, description: dd, secret: ds, stock: dsq } = JSON.parse(draft);
        setName(dn);
        setDescription(dd);
        setSecret(ds);
        setStock(dsq);
      } else {
        setName('');
        setDescription('');
        setSecret(false);
        setStock(undefined);
      }
      setImage(null);
      setPreview(undefined);
    }
    setNotification(null);
  }, [reward]);

  // 2) salvamento automático do rascunho (pulando gravação vazia na 1ª montagem)
  useEffect(() => {
    if (reward) return;
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (
      name.trim() !== '' ||
      description.trim() !== '' ||
      secret !== false ||
      (stock !== undefined && stock !== 0)
    ) {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          secret,
          stock,
        })
      );
    }
  }, [name, description, secret, stock, reward]);

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
        image: image ?? undefined, // se não escolheu nova imagem, mantém a atual
      },
      reward?.id
    );
    // 4) limpa draft
    if (!reward) localStorage.removeItem(DRAFT_KEY);
  };

  // 5) limpa draft ao cancelar
  const handleCancel = () => {
    if (!reward) localStorage.removeItem(DRAFT_KEY);
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.title}>
        {reward ? 'Editar Recompensa' : 'Nova Recompensa'}
      </h2>
      {notification && (
        <Notification type="error" message={notification.message} onClose={() => setNotification(null)} />
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

      <FloatingLabelInput
        id="reward-stock"
        label="Estoque (opcional)"
        type="number"
        value={stock ?? ''}
        onChange={e => setStock(e.target.value === '' ? undefined : Number(e.target.value))}
      />

      {/* --- Imagem com crop 1:1 --- */}
      <div className={styles.fieldGroup}>
        <div className={styles.label}>Ícone / Imagem</div>

        {/* preview atual */}
        {preview && (
          <Image
            src={preview}
            alt="Pré-visualização"
            width={120}
            height={120}
            className={styles.preview}
          />
        )}

        {/* botão que abre a modal de corte */}
        <ImagePickerSquare
          buttonLabel={reward ? 'Trocar imagem' : 'Escolher imagem'}
          stageSize={360}
          outputSize={512}
          outputFileName="reward.jpg"
          outputType="image/jpeg" // fundo branco garantido
          onCropped={(file, dataUrl) => {
            setImage(file);
            setPreview(dataUrl); // usa dataURL do recorte para o preview
          }}
        />
      </div>

      <div className={styles.actions}>
        <Button type="submit">{reward ? 'Salvar' : 'Criar'}</Button>
        <Button bgColor="#AAA" onClick={handleCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

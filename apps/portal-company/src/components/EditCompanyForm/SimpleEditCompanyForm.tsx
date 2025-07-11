// src/components/EditCompanyForm/SimpleEditCompanyForm.tsx
'use client';

import { useEffect, useState, FormEvent, ChangeEvent } from 'react';
import Image from 'next/image';
import { isAxiosError } from 'axios';
import styles from './SimpleEditCompanyForm.module.css';
import Notification from '@/components/Notification/Notification';
import Button from '@/components/Button/Button';
import {
  getCompanyInfo,
  updateCompany,
  uploadCompanyLogo,
} from '@/services/companyService';
import { listCategories } from '@/services/categoryService';
import type { CompanyRead, CompanyUpdate } from '@/types/company';
import type { CategoryRead } from '@/types/category';

/* -------- tipos -------- */
type NotificationType = 'success' | 'error' | 'info';
type FormState = {
  description: string;
  category_ids: string[];
  logo_url?: string;
};

interface SimpleEditCompanyFormProps {
  companyId: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function SimpleEditCompanyForm({
  companyId,
  onClose,
  onSaved,
}: SimpleEditCompanyFormProps) {
  /* --------------------------- state & constants --------------------------- */
  const [form, setForm] = useState<FormState>({
    description: '',
    category_ids: [],
    logo_url: undefined,
  });
  const [categories, setCategories] = useState<CategoryRead[]>([]);
  const [notification, setNotification] = useState<
    { type: NotificationType; message: string } | null
  >(null);
  const maxDescriptionLength = 130;

  // logo upload
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  /* --------------------------- load initial data -------------------------- */
  useEffect(() => {
    getCompanyInfo(companyId).then(res => {
      const data = res.data as CompanyRead;
      setForm({
        description: data.description || '',
        category_ids: data.categories.map(c => c.id),
        logo_url: data.logo_url || undefined,
      });
    });
    listCategories().then(res => setCategories(res.data));
  }, [companyId]);

  /* ------------------------------ handlers -------------------------------- */
  const handleDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length > maxDescriptionLength) {
      setNotification({
        type: 'error',
        message: `Você excedeu o limite em ${
          value.length - maxDescriptionLength
        } caracteres.`,
      });
    } else {
      setNotification(null);
    }
    const trimmed = value.slice(0, maxDescriptionLength);
    setForm(f => ({ ...f, description: trimmed }));
  };

  const handleCategoryToggle = (id: string) => {
    setForm(f => ({
      ...f,
      category_ids: f.category_ids.includes(id)
        ? f.category_ids.filter(x => x !== id)
        : [...f.category_ids, id],
    }));
  };

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      setNotification({ type: 'error', message: 'Selecione uma imagem válida.' });
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      /* upload logo primeiro, se houver */
      if (logoFile) {
        const fd = new FormData();
        fd.append('image', logoFile);
        await uploadCompanyLogo(fd);
      }
      /* description + categorias */
      const payload: Partial<CompanyUpdate> = {
        description: form.description,
        category_ids: form.category_ids,
      };
      await updateCompany(companyId, payload);
      setNotification({
        type: 'success',
        message: 'Informações atualizadas!',
      });
      onSaved();
      onClose();
    } catch (err) {
      const detail = isAxiosError(err)
        ? err.response?.data?.detail
        : undefined;
      setNotification({ type: 'error', message: detail || 'Erro ao salvar.' });
    }
  };

  /* -------------------------------- render -------------------------------- */
  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.background}>
        <h2 className={styles.title}>Complete seu perfil</h2>

        {notification && (
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}

        {/* logo */}
        <div className={styles.logoUpload}>
          {logoPreview ? (
            <Image
              src={logoPreview}
              alt="Pré-visualização"
              className={styles.logoPreview}
              width={128}
              height={128}
              unoptimized
            />
          ) : form.logo_url ? (
            <Image
              src={`${process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL}${form.logo_url}`}
              alt="Logo atual"
              className={styles.logoPreview}
              width={128}
              height={128}
              unoptimized
            />
          ) : (
            <div className={styles.logoPlaceholder}>Sem logo</div>
          )}

          <label className={styles.logoBtn}>
            Escolher logo
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleLogoChange}
            />
          </label>
        </div>

        {/* descrição */}
        <label className={styles.label}>Descrição</label>
        <textarea
          className={styles.textarea}
          value={form.description}
          onChange={handleDescriptionChange}
          placeholder="Conte um pouco sobre seu negócio..."
          maxLength={maxDescriptionLength}
        />
        <div className={styles.charCount}>
          {form.description.length}/{maxDescriptionLength}
        </div>

        {/* categorias */}
        <div className={styles.catContainer}>
          {categories.map(cat => (
            <label key={cat.id} className={styles.catItem}>
              <input
                type="checkbox"
                checked={form.category_ids.includes(cat.id)}
                onChange={() => handleCategoryToggle(cat.id)}
              />
              {cat.name}
            </label>
          ))}
        </div>

        <div className={styles.actions}>
          <Button type="submit">Salvar</Button>
          <Button type="button" bgColor="#AAA" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </form>
  );
}

// src/components/EditCompanyForm/SimpleEditCompanyForm.tsx
'use client';

import { useEffect, useMemo, useState, FormEvent, ChangeEvent } from 'react';
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
import {
  listCategories,
  setPrimaryCategory,
  unsetPrimaryCategory,
} from '@/services/categoryService';
import type { CompanyRead, CompanyUpdate } from '@/types/company';
import type { CategoryRead } from '@/types/category';
import ImagePickerSquare from '@/components/ImagePickerSquare/ImagePickerSquare';

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
  const [primaryCategoryId, setPrimaryCategoryId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [notification, setNotification] = useState<
    { type: NotificationType; message: string } | null
  >(null);
  const maxDescriptionLength = 130;

  // logo upload
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  /* --------------------------- derived helpers ---------------------------- */
  const selectedCategories = useMemo(
    () => categories.filter(c => form.category_ids.includes(c.id)),
    [categories, form.category_ids]
  );

  /* --------------------------- load initial data -------------------------- */
  useEffect(() => {
    (async () => {
      const companyRes = await getCompanyInfo(companyId);
      const data = companyRes.data as CompanyRead;

      setForm({
        description: data.description || '',
        category_ids: (data.categories || []).map(c => c.id),
        logo_url: data.logo_url || undefined,
      });
      setPrimaryCategoryId(data.primary_category_id ?? null);

      const catsRes = await listCategories();
      setCategories(catsRes.data);
    })();
  }, [companyId]);

  /* ----------------------------- auto defaults ---------------------------- */
  // Se tiver exatamente 1 categoria marcada e nenhuma principal, define-a como principal
  useEffect(() => {
    if (form.category_ids.length === 1 && !primaryCategoryId) {
      setPrimaryCategoryId(form.category_ids[0]);
    }
    // Se a principal atual foi desmarcada, limpa a principal
    if (primaryCategoryId && !form.category_ids.includes(primaryCategoryId)) {
      setPrimaryCategoryId(null);
    }
  }, [form.category_ids, primaryCategoryId]);

  /* ------------------------------ handlers -------------------------------- */
  const handleDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length > maxDescriptionLength) {
      setNotification({
        type: 'error',
        message: `Você excedeu o limite em ${value.length - maxDescriptionLength} caracteres.`,
      });
    } else {
      setNotification(null);
    }
    const trimmed = value.slice(0, maxDescriptionLength);
    setForm(f => ({ ...f, description: trimmed }));
  };

  const handleCategoryToggle = (id: string) => {
    setForm(f => {
      const isSelected = f.category_ids.includes(id);
      const next = isSelected
        ? f.category_ids.filter(x => x !== id)
        : [...f.category_ids, id];

      return { ...f, category_ids: next };
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validação: se houver categorias selecionadas, principal é obrigatória
    if (form.category_ids.length > 0 && !primaryCategoryId) {
      setNotification({
        type: 'error',
        message: 'Selecione a categoria principal antes de salvar.',
      });
      return;
    }

    // Garantia extra: se o usuário escolheu uma principal que,
    // por algum motivo, não está nas selecionadas, adiciona.
    const categoryIds = form.category_ids.slice();
    if (primaryCategoryId && !categoryIds.includes(primaryCategoryId)) {
      categoryIds.push(primaryCategoryId);
    }

    try {
      setSaving(true);

      /* upload logo primeiro, se houver */
      if (logoFile) {
        const fd = new FormData();
        fd.append('image', logoFile);
        await uploadCompanyLogo(fd);
      }

      /* description + categorias */
      const payload: Partial<CompanyUpdate> = {
        description: form.description,
        category_ids: categoryIds,
        // você pode enviar primary_category_id no PATCH também,
        // mas como você já tem endpoints dedicados, vamos usá-los abaixo:
        // primary_category_id: primaryCategoryId ?? null,
      };
      await updateCompany(companyId, payload);

      // Define/Remove principal (endpoints dedicados)
      if (primaryCategoryId) {
        await setPrimaryCategory(primaryCategoryId);
      } else {
        // sem categorias -> remove principal
        await unsetPrimaryCategory();
      }

      setNotification({ type: 'success', message: 'Informações atualizadas!' });
      onSaved();
      onClose();
    } catch (err) {
      const detail = isAxiosError(err) ? err.response?.data?.detail : undefined;
      setNotification({ type: 'error', message: detail || 'Erro ao salvar.' });
    } finally {
      setSaving(false);
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

          <ImagePickerSquare
            buttonLabel="Escolher logo"
            stageSize={360}
            outputSize={512}
            outputFileName="logo.jpg"
            outputType="image/jpeg"
            onCropped={(file, dataUrl) => {
              setLogoFile(file);
              setLogoPreview(dataUrl);
            }}
          />
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

        {/* categorias (passo 1) */}
        <label className={styles.label}>Categorias</label>
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

        {/* principal (passo 2) */}
        <div className={styles.primaryBlock}>
          <div className={styles.primaryTitle}>Categoria principal</div>
          {selectedCategories.length === 0 ? (
            <div className={styles.primaryHint}>
              Primeiro selecione uma ou mais categorias acima.
            </div>
          ) : (
            <div className={styles.primaryList}>
              {selectedCategories.map(cat => (
                <label key={cat.id} className={styles.primaryItem}>
                  <input
                    type="radio"
                    name="primaryCategory"
                    checked={primaryCategoryId === cat.id}
                    onChange={() => setPrimaryCategoryId(cat.id)}
                  />
                  {cat.name}
                </label>
              ))}

              {/* Permite “sem principal” se nenhuma categoria for marcada */}
              {/* Quando há categorias marcadas, obrigamos a escolher 1 (validação no submit) */}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <Button type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
          <Button type="button" bgColor="#AAA" onClick={onClose} disabled={saving}>
            Fechar
          </Button>
        </div>
      </div>
    </form>
  );
}

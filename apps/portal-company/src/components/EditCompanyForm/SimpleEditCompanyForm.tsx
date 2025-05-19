'use client';

import { useEffect, useState, FormEvent } from 'react';
import styles from './SimpleEditCompanyForm.module.css';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
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
  const [form, setForm] = useState<FormState>({
    description: '',
    category_ids: [],
    logo_url: undefined,
  });
  const [categories, setCategories] = useState<CategoryRead[]>([]);
  const [notification, setNotification] = useState<{ type: string; message: string } | null>(null);

  // logo upload
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // carrega dados iniciais
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

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, description: e.target.value }));
  };

  const handleCategoryToggle = (id: string) => {
    setForm(f => ({
      ...f,
      category_ids: f.category_ids.includes(id)
        ? f.category_ids.filter(x => x !== id)
        : [...f.category_ids, id],
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      // upload logo primeiro
      if (logoFile) {
        const fd = new FormData();
        fd.append('image', logoFile);
        await uploadCompanyLogo(fd);
      }
      // update descrição + categorias
      const payload: Partial<CompanyUpdate> = {
        description: form.description,
        category_ids: form.category_ids,
      };
      await updateCompany(companyId, payload);
      setNotification({ type: 'success', message: 'Informações atualizadas!' });
      onSaved();
      onClose();
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Erro ao salvar.';
      setNotification({ type: 'error', message: detail });
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2 className={styles.title}>Complete seu perfil</h2>

      {notification && (
        <Notification
          type={notification.type as any}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* logo */}
      <div className={styles.logoUpload}>
        {logoPreview ? (
          <img src={logoPreview} className={styles.logoPreview} />
        ) : form.logo_url ? (
          <img
            src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${form.logo_url}`}
            className={styles.logoPreview}
          />
        ) : (
          <div className={styles.logoPlaceholder}>Sem logo</div>
        )}
        <label className={styles.logoBtn}>
          Escolher logo
          <input type="file" accept="image/*" hidden onChange={handleLogoChange} />
        </label>
      </div>

      {/* descrição */}
      <label className={styles.label}>Descrição</label>
      <textarea
        className={styles.textarea}
        value={form.description}
        onChange={handleDescriptionChange}
        placeholder="Conte um pouco sobre seu negócio..."
      />

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
    </form>
  );
}

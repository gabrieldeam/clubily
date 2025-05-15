'use client';

import { useEffect, useState, FormEvent } from 'react';
import styles from './EditCompanyForm.module.css';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import Notification from '@/components/Notification/Notification';
import Button from '@/components/Button/Button';
import {
  getCompanyInfo,
  updateCompany,
} from '@/services/companyService';
import { listCategories } from '@/services/categoryService';
import type { CompanyRead, CompanyUpdate } from '@/types/company';
import type { CategoryRead } from '@/types/category';

interface EditCompanyFormProps {
  companyId: string;
  onClose: () => void;
  onSaved: () => void; // para atualizar contexto
}

export default function EditCompanyForm({
  companyId,
  onClose,
  onSaved,
}: EditCompanyFormProps) {
  const [step, setStep] = useState<'basic' | 'address'>('basic');
  const [company, setCompany] = useState<CompanyUpdate>({});
  const [categories, setCategories] = useState<CategoryRead[]>([]);
  const [notification, setNotification] = useState<
    { type: 'success' | 'error' | 'info'; message: string } | null
  >(null);

  // busca dados atuais
  useEffect(() => {
    getCompanyInfo(companyId).then(res => {
      const { categories: cats, ...rest } = res.data;
      setCompany({
        ...rest,
        category_ids: cats.map(c => c.id),
      });
    });
    listCategories().then(res => setCategories(res.data));
  }, [companyId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, type, value, checked } = e.target as HTMLInputElement;
    setCompany(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCategoryToggle = (id: string) => {
    setCompany(prev => {
      const current = prev.category_ids ?? [];
      return {
        ...prev,
        category_ids: current.includes(id)
          ? current.filter(c => c !== id)
          : [...current, id],
      };
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await updateCompany(companyId, company);
      setNotification({
        type: 'success',
        message: 'Dados atualizados com sucesso.',
      });
      onSaved();
      onClose();
    } catch (err: any) {
      const detail =
        err.response?.data?.detail || 'Erro ao atualizar dados.';
      setNotification({ type: 'error', message: detail });
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.title}>Editar Empresa</h2>

      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {step === 'basic' ? (
        <>
          <FloatingLabelInput
            id="edit-name"
            name="name"
            label="Nome"
            value={company.name ?? ''}
            onChange={handleChange}
            required
          />
          <FloatingLabelInput
            id="edit-phone"
            name="phone"
            label="Telefone"
            value={company.phone ?? ''}
            onChange={handleChange}
          />
          <FloatingLabelInput
            id="edit-cnpj"
            name="cnpj"
            label="CNPJ"
            value={company.cnpj ?? ''}
            onChange={handleChange}
          />
          <textarea
            name="description"
            placeholder="Descrição"
            className={styles.textarea}
            value={company.description ?? ''}
            onChange={handleChange}
          />

          {/* Seleção de categorias */}
          <div className={styles.catContainer}>
            {categories.map(cat => (
              <label key={cat.id} className={styles.catItem}>
                <input
                  type="checkbox"
                  checked={company.category_ids?.includes(cat.id) || false}
                  onChange={() => handleCategoryToggle(cat.id)}
                />
                {cat.name}
              </label>
            ))}
          </div>

          <Button type="button" onClick={() => setStep('address')}>
            Próximo
          </Button>
        </>
      ) : (
        <>
          <FloatingLabelInput
            id="edit-postal_code"
            name="postal_code"
            label="CEP"
            value={company.postal_code ?? ''}
            onChange={handleChange}
          />
          <FloatingLabelInput
            id="edit-street"
            name="street"
            label="Rua"
            value={company.street ?? ''}
            onChange={handleChange}
          />
          <FloatingLabelInput
            id="edit-city"
            name="city"
            label="Cidade"
            value={company.city ?? ''}
            onChange={handleChange}
          />
          <FloatingLabelInput
            id="edit-state"
            name="state"
            label="Estado"
            value={company.state ?? ''}
            onChange={handleChange}
          />

          <div className={styles.buttons}>
            <Button type="button" bgColor="#FFA600" onClick={() => setStep('basic')}>
              Voltar
            </Button>
            <Button type="submit">Salvar</Button>
          </div>
        </>
      )}
    </form>
  );
}

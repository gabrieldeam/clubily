'use client';

import { useEffect, useState, FormEvent } from 'react';
import editStyles from './EditCompanyForm.module.css';
import resetStyles from '../LoginForm/LoginForm.module.css';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import Notification from '@/components/Notification/Notification';
import Button from '@/components/Button/Button';
import {
  getCompanyInfo,
  updateCompany,
  uploadCompanyLogo,
  forgotPasswordCompany,
  resetPasswordCompany,
} from '@/services/companyService';
import { listCategories } from '@/services/categoryService';
import type { CompanyRead, CompanyUpdate } from '@/types/company';
import type { CategoryRead } from '@/types/category';

type NotificationType = 'success' | 'error' | 'info';
type NotificationData = { type: NotificationType; message: string };

/** Estado interno = campos de PATCH + logo_url para preview */
type CompanyFormState = CompanyUpdate & { logo_url?: string };

interface CompanySettingsProps {
  companyId: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function CompanySettings({ companyId, onClose, onSaved }: CompanySettingsProps) {
  // --- Company Edit State ---
  const [company, setCompany] = useState<CompanyFormState>({});
  const [categories, setCategories] = useState<CategoryRead[]>([]);
  const [companyNotification, setCompanyNotification] = useState<NotificationData | null>(null);

  const [showAddress, setShowAddress] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [dataDirty, setDataDirty] = useState(false);

  useEffect(() => {
    getCompanyInfo(companyId).then(res => {
      const { categories: cats, ...rest } = res.data as CompanyRead;
      setCompany({
        ...rest,
        logo_url: rest.logo_url ?? undefined,
        category_ids: cats.map(c => c.id),
      });
      setDataDirty(false);
    });
    listCategories().then(res => setCategories(res.data));
  }, [companyId]);

  useEffect(() => {
    const cep = (company.postal_code ?? '').replace(/\D/g, '');
    if (showAddress && cep.length === 8) {
      fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(r => r.json())
        .then(data => {
          if (!data.erro) {
            setCompany(prev => ({
              ...prev,
              street: data.logradouro || '',
              city: data.localidade || '',
              state: data.uf || '',
            }));
            setDataDirty(true);
          } else {
            setCompanyNotification({ type: 'error', message: 'CEP não encontrado.' });
          }
        })
        .catch(() =>
          setCompanyNotification({ type: 'error', message: 'Erro ao buscar CEP.' }),
        );
    }
  }, [company.postal_code, showAddress]);

  useEffect(() => {
  if (company.email) {
    setEmail(company.email);
  }
}, [company.email]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, type, value, checked } = e.target as HTMLInputElement;
    setCompany(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setDataDirty(true);
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
    setDataDirty(true);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    } else {
      setCompanyNotification({ type: 'error', message: 'Selecione um arquivo de imagem válido.' });
    }
  };

  const handleCompanySubmit = async (e: FormEvent) => {
    e.preventDefault();
    const hasLogoChange = !!logoFile;
    const hasDataChange = dataDirty;

    try {
      if (hasLogoChange && !hasDataChange) {
        const fd = new FormData();
        fd.append('image', logoFile as File);
        await uploadCompanyLogo(fd);
        setCompanyNotification({ type: 'success', message: 'Logo atualizada com sucesso.' });
      } else if (!hasLogoChange && hasDataChange) {
        const { logo_url: _, ...base } = company;
        let payload: Partial<CompanyUpdate> = { ...base };
        if (!showAddress) {
          delete payload.postal_code;
          delete payload.street;
          delete payload.city;
          delete payload.state;
        }
        await updateCompany(companyId, payload);
        setCompanyNotification({ type: 'success', message: 'Dados atualizados com sucesso.' });
      } else if (hasLogoChange && hasDataChange) {
        const fd = new FormData();
        fd.append('image', logoFile as File);
        await uploadCompanyLogo(fd);
        const { logo_url: _, ...base } = company;
        let payload: Partial<CompanyUpdate> = { ...base };
        if (!showAddress) {
          delete payload.postal_code;
          delete payload.street;
          delete payload.city;
          delete payload.state;
        }
        await updateCompany(companyId, payload);
        setCompanyNotification({ type: 'success', message: 'Logo e dados atualizados com sucesso.' });
      } else {
        setCompanyNotification({ type: 'info', message: 'Nenhuma alteração para salvar.' });
        return;
      }

      onSaved();
      onClose();
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Erro ao atualizar dados.';
      setCompanyNotification({ type: 'error', message: detail });
    }
  };

  // --- Password Reset State ---
  const [mode, setMode] = useState<'forgot' | 'reset'>('forgot');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetNotification, setResetNotification] = useState<NotificationData | null>(null);

  const clearResetFields = () => {
    setEmail('');
    setCode('');
    setNewPassword('');
    setResetNotification(null);
  };

  const handleForgot = async (e: FormEvent) => {
    e.preventDefault();
    setResetNotification(null);
    try {
      await forgotPasswordCompany(email);
      setResetNotification({ type: 'info', message: 'Código enviado para seu e-mail.' });
      setMode('reset');
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Erro ao enviar código.';
      setResetNotification({ type: 'error', message: detail });
    }
  };

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    setResetNotification(null);
    try {
      await resetPasswordCompany(code, newPassword);
      setResetNotification({ type: 'success', message: 'Senha redefinida com sucesso!' });
      clearResetFields();
      setMode('forgot');
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Erro na redefinição.';
      setResetNotification({ type: 'error', message: detail });
    }
  };

  return (
    <div>
      {/* Edit Company Form */}
      <form onSubmit={handleCompanySubmit} className={editStyles.form}>
        {companyNotification && (
          <Notification
            type={companyNotification.type}
            message={companyNotification.message}
            onClose={() => setCompanyNotification(null)}
          />
        )}

        {!showAddress ? (
          <>
            <div className={editStyles.background}>
              <div className={editStyles.logoUpload}>
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Pré-visualização"
                    className={editStyles.logoPreview}
                  />
                ) : company.logo_url ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL}${company.logo_url}`}
                    alt="Logo atual"
                    className={editStyles.logoPreview}
                  />
                ) : (
                  <div className={editStyles.logoPlaceholder}>Sem logo</div>
                )}

                <label className={editStyles.logoBtn}>
                  Trocar logo
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleLogoChange}
                  />
                </label>
              </div>

              <FloatingLabelInput
                id="edit-name"
                name="name"
                label="Nome"
                value={company.name ?? ''}
                onChange={handleChange}
                required
              />

              <textarea
                name="description"
                placeholder="Descrição"
                className={editStyles.textarea}
                value={company.description ?? ''}
                onChange={handleChange}
              />
            </div>

            <div className={editStyles.background}>
              <FloatingLabelInput
                id="edit-phone"
                name="phone"
                label="Telefone"
                value={company.phone ?? ''}
                onChange={handleChange}
              />
              <FloatingLabelInput
                id="edit-email"
                name="email"
                label="E-mail"
                value={company.email ?? ''}
                onChange={handleChange}
              />
              <FloatingLabelInput
                id="edit-cnpj"
                name="cnpj"
                label="CNPJ"
                value={company.cnpj ?? ''}
                onChange={handleChange}
              />

              <div className={editStyles.catContainer}>
                {categories.map(cat => (
                  <label key={cat.id} className={editStyles.catItem}>
                    <input
                      type="checkbox"
                      checked={company.category_ids?.includes(cat.id) || false}
                      onChange={() => handleCategoryToggle(cat.id)}
                    />
                    {cat.name}
                  </label>
                ))}
              </div>

              <button
                type="button"
                className={editStyles.addressButton}
                onClick={() => setShowAddress(true)}
              >
                Editar Endereço
              </button>
            </div>

            <div className={editStyles.buttons}>
              <Button type="submit">Salvar</Button>
              <Button type="button" bgColor="#AAA" onClick={onClose}>
                Cancelar
              </Button>
            </div>
          </>
        ) : (
          <div className={editStyles.background}>
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

            <Button bgColor="#FFA600" onClick={() => setShowAddress(false)}>
              Continuar
            </Button>
          </div>
        )}
      </form>

      {/* Password Reset Form */}
      <div className={editStyles.forgotBackground}>
        <form
          onSubmit={mode === 'forgot' ? handleForgot : handleReset}
          className={resetStyles.form}
        >
          <h4 className={resetStyles.title}>
            {mode === 'forgot' ? 'Redefinir senha' : 'Nova senha'}
          </h4>

          {resetNotification && (
            <Notification
              type={resetNotification.type}
              message={resetNotification.message}
              onClose={() => setResetNotification(null)}
            />
          )}

          {mode === 'forgot' && (
            <FloatingLabelInput
              id="reset-email"
              name="email"
              label="E-mail cadastrado"
              type="email"
              value={email} 
              onChange={e => setEmail(e.target.value)}
              required
            />
          )}


          {mode === 'reset' && (
            <>
              <FloatingLabelInput
                id="reset-code"
                name="code"
                label="Código de verificação"
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                required
              />
              <FloatingLabelInput
                id="reset-password"
                name="newPassword"
                label="Nova senha"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
            </>
          )}

          <div className={resetStyles.actions}>
            <Button type="submit">
              {mode === 'forgot' ? 'Enviar código' : 'Redefinir senha'}
            </Button>
          </div>

          {mode === 'reset' && (
            <div className={resetStyles.link}>
              <a
                onClick={() => {
                  clearResetFields();
                  setMode('forgot');
                }}
              >
                Voltar
              </a>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

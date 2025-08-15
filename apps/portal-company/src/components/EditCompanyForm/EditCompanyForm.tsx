// src/components/EditCompanyForm/EditCompanyForm.tsx
'use client';

import { useEffect, useMemo, useState, FormEvent } from 'react';
import Image from 'next/image';
import { isAxiosError } from 'axios';
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
import {
  listCategories,
  setPrimaryCategory,
  unsetPrimaryCategory,
} from '@/services/categoryService';
import type { CompanyRead, CompanyUpdate } from '@/types/company';
import type { CategoryRead } from '@/types/category';

// 👉 picker/cropper 1:1
import ImagePickerSquare from '@/components/ImagePickerSquare/ImagePickerSquare';

type NotificationType = 'success' | 'error' | 'info';
type NotificationData = { type: NotificationType; message: string };

/** Estado interno = campos de PATCH + logo_url para preview */
type CompanyFormState = CompanyUpdate & { logo_url?: string };

interface CompanySettingsProps {
  companyId: string;
  onClose: () => void;
  onSaved: () => void;
}

// nomes dos campos de endereço (e onlines) que podem fazer parte do PATCH
const addressFieldNames = [
  'postal_code',
  'street',
  'city',
  'state',
  'number',
  'neighborhood',
  'complement',
  'online_url',
  'only_online',
] as const;

type AddressField = typeof addressFieldNames[number];
const isAddressField = (n: string): n is AddressField =>
  (addressFieldNames as readonly string[]).includes(n as AddressField);

export default function CompanySettings({
  companyId,
  onClose,
  onSaved,
}: CompanySettingsProps) {
  // --- Company Edit State ---
  const [company, setCompany] = useState<CompanyFormState>({});
  const [categories, setCategories] = useState<CategoryRead[]>([]);
  const [companyNotification, setCompanyNotification] =
    useState<NotificationData | null>(null);
  const maxDescriptionLength = 130;
  const [showAddress, setShowAddress] = useState(false);

  // logo (após crop fica 1:1 e com fundo branco)
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [dataDirty, setDataDirty] = useState(false);
  const [addressDirty, setAddressDirty] = useState(false); // <- novo

  // ---- Categoria principal ----
  const [primaryCategoryId, setPrimaryCategoryId] = useState<string | null>(null);
  const [originalPrimaryCategoryId, setOriginalPrimaryCategoryId] = useState<string | null>(null);

  // Derivadas
  const selectedCategories = useMemo(
    () => categories.filter(c => (company.category_ids ?? []).includes(c.id)),
    [categories, company.category_ids]
  );

  type FastAPIErrorItem = {
    loc?: string | (string | number)[];
    msg?: string;
    message?: string;
    detail?: unknown;
    [key: string]: unknown;
  };

  function formatErrorDetail(detail: unknown): string {
    if (!detail) return 'Erro inesperado.';
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      const items = detail as FastAPIErrorItem[];
      const parts = items.map((d) => {
        const loc =
          Array.isArray(d.loc)
            ? d.loc.join('.')
            : typeof d.loc === 'string'
            ? d.loc
            : undefined;

        const msg =
          typeof d.msg === 'string'
            ? d.msg
            : typeof d.message === 'string'
            ? d.message
            : JSON.stringify(d);

        return loc ? `${loc}: ${msg}` : msg;
      });
      return parts.join('\n');
    }
    if (typeof detail === 'object' && detail !== null) {
      const obj = detail as FastAPIErrorItem;
      if (typeof obj.msg === 'string') return obj.msg;
      if (obj.detail && obj.detail !== detail) {
        return formatErrorDetail(obj.detail);
      }
      try {
        return Object.entries(obj)
          .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
          .join('\n');
      } catch { /* ignore */ }
    }
    try { return JSON.stringify(detail); } catch { return String(detail); }
  }

  /* --------------------------- carregar dados --------------------------- */
  useEffect(() => {
    (async () => {
      const res = await getCompanyInfo(companyId);
      const data = res.data as CompanyRead;
      const { categories: cats, primary_category_id, ...rest } = data;

      setCompany({
        ...rest,
        logo_url: rest.logo_url ?? undefined,
        category_ids: (cats || []).map((c) => c.id),
      });

      setPrimaryCategoryId(primary_category_id ?? null);
      setOriginalPrimaryCategoryId(primary_category_id ?? null);

      setLogoPreview(null);
      setDataDirty(false);
      setAddressDirty(false); // <- importante: novo carregamento, nada editado ainda

      const catRes = await listCategories();
      setCategories(catRes.data);
    })();
  }, [companyId]);

  /* --------------------- auto-preencher via CEP (ViaCEP) --------------------- */
  useEffect(() => {
    const cep = (company.postal_code ?? '').replace(/\D/g, '');
    if (showAddress && cep.length === 8) {
      fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then((r) => r.json())
        .then((data) => {
          if (!data.erro) {
            setCompany((prev) => ({
              ...prev,
              street: data.logradouro || '',
              city: data.localidade || '',
              state: data.uf || '',
            }));
            setDataDirty(true);
            setAddressDirty(true); // <- marcar que houve edição de endereço
          } else {
            setCompanyNotification({
              type: 'error',
              message: 'CEP não encontrado.',
            });
          }
        })
        .catch(() =>
          setCompanyNotification({
            type: 'error',
            message: 'Erro ao buscar CEP.',
          }),
        );
    }
  }, [company.postal_code, showAddress]);

  /* --------------------------- helpers de input -------------------------- */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    const type = (target as HTMLInputElement).type;
    const name = (target.name || '') as keyof CompanyFormState | string;

    const raw: string | boolean =
      type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;

    // cast via unknown para evitar 'any'
    const key = name as keyof CompanyFormState;
    const value = raw as unknown as CompanyFormState[typeof key];

    setCompany((prev) => ({
      ...prev,
      [key]: value,
    }));
    setDataDirty(true);

    if (isAddressField(name)) {
      setAddressDirty(true);
    }
  };

  const handleCategoryToggle = (id: string) => {
    setCompany((prev) => {
      const current = prev.category_ids ?? [];
      const next = current.includes(id) ? current.filter(c => c !== id) : [...current, id];
      return { ...prev, category_ids: next };
    });
    setDataDirty(true);
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const value = e.target.value;
    if (value.length > maxDescriptionLength) {
      setCompanyNotification({
        type: 'error',
        message: `Você excedeu o limite em ${value.length - maxDescriptionLength} caracteres.`,
      });
    } else {
      setCompanyNotification(null);
    }
    setCompany((prev) => ({
      ...prev,
      description: value.slice(0, maxDescriptionLength),
    }));
    setDataDirty(true);
  };

  /* ----------------------------- regras da principal ---------------------------- */
  useEffect(() => {
    const ids = company.category_ids ?? [];
    if (ids.length === 1 && !primaryCategoryId) {
      setPrimaryCategoryId(ids[0]);
    }
    if (primaryCategoryId && !ids.includes(primaryCategoryId)) {
      setPrimaryCategoryId(null);
    }
  }, [company.category_ids, primaryCategoryId]);

  /* ----------------------------- submit dados ---------------------------- */
  const handleCompanySubmit = async (e: FormEvent) => {
    e.preventDefault();

    const ids = company.category_ids ?? [];
    const hasLogoChange = !!logoFile;
    const hasDataChange = dataDirty;

    const desiredPrimary = primaryCategoryId ?? null;
    const primaryChanged = desiredPrimary !== originalPrimaryCategoryId;

    if (ids.length > 0 && !desiredPrimary) {
      setCompanyNotification({
        type: 'error',
        message: 'Selecione a categoria principal antes de salvar.',
      });
      return;
    }

    const category_ids = ids.slice();
    if (desiredPrimary && !category_ids.includes(desiredPrimary)) {
      category_ids.push(desiredPrimary);
    }

    try {
      /* ---------- Logo (se houver) ---------- */
      if (hasLogoChange) {
        const fd = new FormData();
        fd.append('image', logoFile as File);
        await uploadCompanyLogo(fd);
      }

      /* ---------- Dados (se houver) ---------- */
      if (hasDataChange) {
        const payload: Partial<CompanyUpdate> = { ...company, category_ids };
        // não envia logo_url no PATCH
        delete (payload as Partial<CompanyUpdate> & { logo_url?: string }).logo_url;

        // Se o endereço NÃO foi mexido, omita campos de endereço/online do PATCH
        if (!addressDirty) {
          for (const f of addressFieldNames) {
            const key = f as keyof CompanyUpdate;
            if (key in payload) {
              delete payload[key];
            }
          }
        }

        await updateCompany(companyId, payload as CompanyUpdate);
      }

      /* ---------- Principal (se mudou ou se não há categorias) ---------- */
      if (category_ids.length === 0) {
        if (originalPrimaryCategoryId !== null) {
          await unsetPrimaryCategory();
          setOriginalPrimaryCategoryId(null);
        }
      } else if (primaryChanged) {
        if (desiredPrimary) {
          await setPrimaryCategory(desiredPrimary);
          setOriginalPrimaryCategoryId(desiredPrimary);
        } else {
          await unsetPrimaryCategory();
          setOriginalPrimaryCategoryId(null);
        }
      }

      if (!hasLogoChange && !hasDataChange && !primaryChanged) {
        setCompanyNotification({ type: 'info', message: 'Nenhuma alteração para salvar.' });
        return;
      }

      setCompanyNotification({
        type: 'success',
        message:
          hasLogoChange && hasDataChange
            ? 'Logo e dados atualizados com sucesso.'
            : hasLogoChange
            ? 'Logo atualizada com sucesso.'
            : hasDataChange
            ? 'Dados atualizados com sucesso.'
            : 'Categoria principal atualizada com sucesso.',
      });

      onSaved();
      onClose();
    } catch (err) {
      const detail = isAxiosError(err) ? err.response?.data?.detail : undefined;
      setCompanyNotification({
        type: 'error',
        message: formatErrorDetail(detail) || 'Erro ao atualizar dados.',
      });
    }
  };

  /* --------------------------- password reset --------------------------- */
  const [mode, setMode] = useState<'forgot' | 'reset'>('forgot');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetNotification, setResetNotification] =
    useState<NotificationData | null>(null);

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
      setResetNotification({
        type: 'info',
        message: 'Código enviado para seu e-mail.',
      });
      setMode('reset');
    } catch (err) {
      const detail = isAxiosError(err)
        ? err.response?.data?.detail
        : undefined;
      setResetNotification({
        type: 'error',
        message: formatErrorDetail(detail) || 'Erro ao enviar código.',
      });
    }
  };

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    setResetNotification(null);
    try {
      await resetPasswordCompany(code, newPassword);
      setResetNotification({
        type: 'success',
        message: 'Senha redefinida com sucesso!',
      });
      clearResetFields();
      setMode('forgot');
    } catch (err) {
      const detail = isAxiosError(err)
        ? err.response?.data?.detail
        : undefined;
      setResetNotification({
        type: 'error',
        message: formatErrorDetail(detail) || 'Erro na redefinição.',
      });
    }
  };

  /* =============================== JSX =============================== */
  return (
    <div className={editStyles.page}>
      {/* -------------------- Edit Company Form -------------------- */}
      <form onSubmit={handleCompanySubmit} className={editStyles.form}>
        {companyNotification && (
          <Notification
            type={companyNotification.type}
            message={String(companyNotification.message)}
            onClose={() => setCompanyNotification(null)}
          />
        )}

        {!showAddress ? (
          <>
            <div className={editStyles.back}>
              <div className={editStyles.background}>
                {/* ---------- logo (com cropper) ---------- */}
                <div className={editStyles.logoUpload}>
                  {logoPreview ? (
                    <Image
                      src={logoPreview}
                      alt="Pré-visualização"
                      className={editStyles.logoPreview}
                      width={128}
                      height={128}
                      unoptimized
                    />
                  ) : company.logo_url ? (
                    <Image
                      src={`${process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL}${company.logo_url}`}
                      alt="Logo atual"
                      className={editStyles.logoPreview}
                      width={128}
                      height={128}
                      unoptimized
                    />
                  ) : (
                    <div className={editStyles.logoPlaceholder}>Sem logo</div>
                  )}

                  <ImagePickerSquare
                    buttonLabel="Trocar logo"
                    stageSize={360}
                    outputSize={512}
                    outputFileName="logo.jpg"
                    outputType="image/jpeg"
                    onCropped={(file, dataUrl) => {
                      setLogoFile(file);
                      setLogoPreview(dataUrl);
                      // upload da logo é separado, não marca dataDirty
                    }}
                  />
                </div>

                {/* ---------- campos básicos ---------- */}
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
                  onChange={handleDescriptionChange}
                />
                <div className={editStyles.charCount}>
                  {company.description?.length ?? 0}/{maxDescriptionLength}
                </div>
              </div>

              {/* ---------- contato & categorias ---------- */}
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

                {/* ------ categorias (checkbox) ------ */}
                <div className={editStyles.catContainer}>
                  {categories.map((cat) => (
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

                {/* ------ categoria principal (radio nas selecionadas) ------ */}
                <div className={editStyles.primaryBlock}>
                  <div className={editStyles.primaryTitle}>Categoria principal</div>
                  {selectedCategories.length === 0 ? (
                    <div className={editStyles.primaryHint}>
                      Selecione uma ou mais categorias acima para escolher a principal.
                    </div>
                  ) : (
                    <div className={editStyles.primaryList}>
                      {selectedCategories.map((cat) => (
                        <label key={cat.id} className={editStyles.primaryItem}>
                          <input
                            type="radio"
                            name="primaryCategory"
                            checked={primaryCategoryId === cat.id}
                            onChange={() => setPrimaryCategoryId(cat.id)}
                          />
                          {cat.name}
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className={editStyles.addressButton}
                  onClick={() => setShowAddress(true)}
                >
                  Editar Endereço
                </button>
              </div>
            </div>

            <div className={editStyles.buttons}>
              <Button type="submit">Salvar</Button>
              <Button type="button" bgColor="#AAA" onClick={onClose}>
                Cancelar
              </Button>
            </div>
          </>
        ) : (
          /* ---------------------- formulário de endereço ---------------------- */
          <div className={editStyles.background}>
            <h3>Endereço</h3>
            <FloatingLabelInput
              id="edit-postal_code"
              name="postal_code"
              label="CEP"
              value={company.postal_code ?? ''}
              onChange={handleChange}
            />
            <div className={editStyles.flex}>
              <FloatingLabelInput
                id="edit-street"
                name="street"
                label="Rua"
                value={company.street ?? ''}
                onChange={handleChange}
              />
              <FloatingLabelInput
                id="edit-number"
                name="number"
                label="Número"
                type="text"
                value={company.number ?? ''}
                onChange={handleChange}
              />
            </div>

            <div className={editStyles.flex}>
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
              <FloatingLabelInput
                id="edit-neighborhood"
                name="neighborhood"
                label="Bairro"
                type="text"
                value={company.neighborhood ?? ''}
                onChange={handleChange}
              />
            </div>

            <FloatingLabelInput
              id="edit-complement"
              name="complement"
              label="Complemento (opcional)"
              type="text"
              value={company.complement ?? ''}
              onChange={handleChange}
            />

            {/* — Online — */}
            <FloatingLabelInput
              id="edit-online_url"
              name="online_url"
              label="URL Online (opcional)"
              type="text"
              value={company.online_url ?? ''}
              onChange={handleChange}
            />

            <div className={editStyles.flex}>
              <input
                type="checkbox"
                id="only_online"
                name="only_online"
                checked={company.only_online ?? false}
                onChange={handleChange}
              />
              <label htmlFor="only_online">
                Este estabelecimento é somente online
              </label>
            </div>

            <Button bgColor="#FFA600" onClick={() => setShowAddress(false)}>
              Continuar
            </Button>
          </div>
        )}
      </form>

      {/* ----------------------- Password Reset Form ----------------------- */}
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
              onChange={(e) => setEmail(e.target.value)}
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
                onChange={(e) => setCode(e.target.value)}
                required
              />
              <FloatingLabelInput
                id="reset-password"
                name="newPassword"
                label="Nova senha"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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

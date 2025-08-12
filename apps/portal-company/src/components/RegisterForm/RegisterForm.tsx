// src/components/RegisterForm/RegisterForm.tsx
'use client';

import { FormEvent, useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { useSearchParams } from 'next/navigation';
import styles from './RegisterForm.module.css';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import Notification from '@/components/Notification/Notification';
import Button from '@/components/Button/Button';
import { Eye, EyeOff } from 'lucide-react';
import { registerCompany, redeemReferral } from '@/services/companyService';
import type { CompanyCreate, ReferralRedeem } from '@/types/company';

// Tipos
type NotificationType = 'success' | 'error' | 'info';
interface NotificationData {
  type: NotificationType;
  message: string;
}

type LocalForm = CompanyCreate & { confirm_password: string };
type Stage = 'register' | 'referral';

interface RegisterFormProps {
  onSuccess: () => void;
  /** Opcional: se você quiser injetar o código por prop.
   *  Se não for passado, o componente tenta ler da URL (?code=XYZ). */
  initialReferralCode?: string;
}

export default function RegisterForm({ onSuccess, initialReferralCode }: RegisterFormProps) {
  const searchParams = useSearchParams();

  const [form, setForm] = useState<LocalForm>({
    name: '',
    email: '',
    phone: '',
    cnpj: '',
    password: '',
    confirm_password: '',
    postal_code: '',
    street: '',
    city: '',
    state: '',
    number: '',
    neighborhood: '',
    complement: '',
    description: '',
    online_url: '',
    only_online: false,
    accepted_terms: false,
  });

  const [notification, setNotification] = useState<NotificationData | null>(null);
  const [showAddress, setShowAddress] = useState(false);
  const [stage, setStage] = useState<Stage>('register');

  // controla se as senhas estão visíveis
  const [showPasswords, setShowPasswords] = useState(false);

  // estado para referral
  const [referralCode, setReferralCode] = useState('');
  const [referralNotification, setReferralNotification] = useState<NotificationData | null>(null);

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

  useEffect(() => {
    const codeFromUrl = searchParams.get('code') ?? '';
    const value = (initialReferralCode && initialReferralCode.trim()) || codeFromUrl;
    if (value) setReferralCode(value);
  }, [initialReferralCode, searchParams]);

  // ViaCEP
  useEffect(() => {
    const cep = form.postal_code.replace(/\D/g, '');
    if (showAddress && cep.length === 8) {
      fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(res => res.json())
        .then(data => {
          if (data.erro) {
            setNotification({ type: 'error', message: 'CEP não encontrado.' });
          } else {
            setForm(prev => ({
              ...prev,
              street: data.logradouro || '',
              neighborhood: data.bairro   || '',
              city: data.localidade || '',
              state: data.uf || '',
            }));
          }
        })
        .catch(() =>
          setNotification({ type: 'error', message: 'Erro ao buscar CEP.' })
        );
    }
  }, [form.postal_code, showAddress]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const t = e.target as HTMLInputElement;
    setForm(prev => ({
      ...prev,
      [t.name]: t.type === 'checkbox' ? t.checked : t.value,
    }));
    setNotification(null);
  };

  // 1) disparar registro
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setNotification(null);

    // validações básicas
    const missing: string[] = [];
    if (!form.name) missing.push('Nome');
    if (!form.email) missing.push('E-mail');
    if (!form.phone) missing.push('Telefone');
    if (!form.cnpj) missing.push('CNPJ');
    if (!form.password) missing.push('Senha');
    if (!form.confirm_password) missing.push('Confirmação de senha');
    if (!form.postal_code) missing.push('CEP');
    if (!form.street) missing.push('Rua');
    if (!form.city) missing.push('Cidade');
    if (!form.state) missing.push('Estado');
    if (!form.number) missing.push('Número');
    if (!form.neighborhood) missing.push('Bairro');
    if (!form.accepted_terms) missing.push('Termos de uso');

    if (form.online_url && !/^https?:\/\//i.test(form.online_url)) {
      setNotification({
        type: 'error',
        message: 'Informe a URL completa, incluindo http:// ou https://.',
      });
      return;
    }

    if (missing.length > 0) {
      setNotification({
        type: 'error',
        message: `Campo${missing.length > 1 ? 's' : ''} ${missing.join(', ')} ${missing.length > 1 ? 'são' : 'é'} obrigatório${missing.length > 1 ? 's' : ''}.`,
      });
      return;
    }

    if (!passwordRegex.test(form.password)) {
      setNotification({
        type: 'error',
        message: 'Senha deve ter ≥8 caracteres, incluindo 1 maiúscula, 1 minúscula, 1 número e 1 especial.',
      });
      return;
    }

    if (form.password !== form.confirm_password) {
      setNotification({ type: 'error', message: 'As senhas não coincidem.' });
      return;
    }

    // remove confirm_password
    const payload: CompanyCreate = { ...form };
    delete (payload as { confirm_password?: string }).confirm_password;
    try {
      await registerCompany(payload);
      setStage('referral');
    } catch (err) {
      const data = isAxiosError(err) ? err.response?.data : undefined;
      let msg = 'Erro no cadastro. Tente novamente.';
      if (data) {
        if (typeof data.detail === 'string') msg = data.detail;
        else if (Array.isArray(data.detail)) msg = (data.detail as { msg: string }[]).map(d => d.msg).join(', ');
      }
      setNotification({ type: 'error', message: msg });
    }
  };

  // 2) resgate de referral
  const handleRedeem = async () => {
    setReferralNotification(null);
    if (!referralCode.trim()) {
      setReferralNotification({ type: 'error', message: 'Informe o código.' });
      return;
    }
    try {
      await redeemReferral({ referral_code: referralCode } as ReferralRedeem);
      setReferralNotification({ type: 'success', message: 'Código registrado com sucesso!' });
      setTimeout(onSuccess, 800);
    } catch (err) {
      const detail = isAxiosError(err) ? err.response?.data?.detail : undefined;
      setReferralNotification({ type: 'error', message: detail || 'Código inválido.' });
    }
  };

  const handleSkipReferral = () => onSuccess();

  // RENDER
  if (stage === 'referral') {
    return (
      <div className={styles.form}>
        <h2 className={styles.title}>Código de indicação</h2>
        {referralNotification && (
          <Notification
            type={referralNotification.type}
            message={referralNotification.message}
            onClose={() => setReferralNotification(null)}
          />
        )}
        <FloatingLabelInput
          id="referral_code"
          name="referral_code"
          label="Código de indicação"
          type="text"
          value={referralCode}
          onChange={e => setReferralCode(e.target.value)}
        />
        <div className={styles.actions}>
          <Button onClick={handleRedeem}>Registrar indicação</Button>
          <Button bgColor="#AAA" onClick={handleSkipReferral}>Não tenho código</Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.title}>Cadastro</h2>
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* ETAPA 1 */}
      {!showAddress && (
        <>
          <FloatingLabelInput
            id="register-name"
            name="name"
            label="Nome da empresa"
            type="text"
            value={form.name}
            onChange={handleChange}
          />
          <FloatingLabelInput
            id="register-email"
            name="email"
            label="E-mail"
            type="email"
            value={form.email}
            onChange={handleChange}
          />
          <div className={styles.flex}>
            <FloatingLabelInput
              id="register-phone"
              name="phone"
              label="Telefone"
              type="text"
              value={form.phone}
              onChange={handleChange}
            />
            <FloatingLabelInput
              id="register-cnpj"
              name="cnpj"
              label="CNPJ"
              type="text"
              value={form.cnpj}
              onChange={handleChange}
            />
          </div>
          <button
            type="button"
            className={styles.addressButton}
            onClick={() => setShowAddress(true)}
          >
            Adicionar Endereço
          </button>

          <div className={styles.flex}>
            <FloatingLabelInput
              id="register-password"
              name="password"
              label="Senha"
              type="password"
              value={form.password}
              onChange={handleChange}
              showPassword={showPasswords}
            />
            <FloatingLabelInput
              id="register-confirm-password"
              name="confirm_password"
              label="Confirme a senha"
              type="password"
              value={form.confirm_password}
              onChange={handleChange}
              showPassword={showPasswords}
            />
            {/* botão externo de visibilidade */}
            <button
              type="button"
              className={styles.eyeToggle}
              onClick={() => setShowPasswords(prev => !prev)}
              aria-label={showPasswords ? 'Ocultar senhas' : 'Mostrar senhas'}
            >
              {showPasswords ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className={styles.termsContainer}>
            <input
              type="checkbox"
              id="accepted_terms"
              name="accepted_terms"
              checked={form.accepted_terms}
              onChange={handleChange}
            />
            <label htmlFor="accepted_terms">Aceito os termos de uso</label>
          </div>
          <Button type="submit">Cadastrar</Button>
        </>
      )}

      {/* ETAPA 2 */}
      {showAddress && (
        <>
          <FloatingLabelInput
            id="register-postal_code"
            name="postal_code"
            label="CEP"
            type="text"
            value={form.postal_code}
            onChange={handleChange}
          />
          <div className={styles.flex}>
            <FloatingLabelInput
              id="register-street"
              name="street"
              label="Rua"
              type="text"
              value={form.street}
              onChange={handleChange}
            />
            <FloatingLabelInput
              id="register-number"
              name="number"
              label="Número"
              type="text"
              value={form.number}
              onChange={handleChange}
            />
          </div>
          <div className={styles.flex}>
            <FloatingLabelInput
              id="register-city"
              name="city"
              label="Cidade"
              type="text"
              value={form.city}
              onChange={handleChange}
            />
            <FloatingLabelInput
              id="register-state"
              name="state"
              label="Estado"
              type="text"
              value={form.state}
              onChange={handleChange}
            />
            <FloatingLabelInput
              id="register-neighborhood"
              name="neighborhood"
              label="Bairro"
              type="text"
              value={form.neighborhood}
              onChange={handleChange}
            />
          </div>
          <FloatingLabelInput
            id="register-complement"
            name="complement"
            label="Complemento (opcional)"
            type="text"
            value={form.complement ?? ''}
            onChange={handleChange}
          />
          <FloatingLabelInput
            id="register-online_url"
            name="online_url"
            label="URL Online (opcional)"
            type="text"
            value={form.online_url}
            onChange={handleChange}
          />
          <div className={styles.termsContainer}>
            <input
              type="checkbox"
              id="only_online"
              name="only_online"
              checked={form.only_online}
              onChange={handleChange}
            />
            <label htmlFor="only_online">
              Este estabelecimento é somente online
            </label>
          </div>
          <Button
            bgColor="#FFA600"
            onClick={() => setShowAddress(false)}
          >
            Continuar
          </Button>
        </>
      )}
    </form>
  );
}

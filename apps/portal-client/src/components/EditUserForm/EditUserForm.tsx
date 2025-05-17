'use client';

import { useEffect, useState, FormEvent } from 'react';
import editStyles from './EditUserForm.module.css';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import Notification from '@/components/Notification/Notification';
import Button from '@/components/Button/Button';
import {
  getCurrentUser,
  updateCurrentUser,
  forgotPasswordUser,
  resetPasswordUser,
} from '@/services/userService';
import type { UserRead, UserUpdate } from '@/types/user';

type NotificationType = 'success' | 'error' | 'info';
type NotificationData = { type: NotificationType; message: string };

export default function EditUserForm({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  // --- Perfil State ---
  const [form, setForm] = useState<UserUpdate>({});
  const [notification, setNotification] = useState<NotificationData | null>(null);
  const [loading, setLoading] = useState(true);

  // --- Password Reset State ---
  const [mode, setMode] = useState<'forgot' | 'reset'>('forgot');
  const [emailForReset, setEmailForReset] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetNotification, setResetNotification] = useState<NotificationData | null>(null);

  useEffect(() => {
    getCurrentUser()
      .then(({ data }) => {
        setForm({
          name: data.name,
          email: data.email,
          phone: data.phone ?? '',
        });
        // já pré-preenche o e-mail no form de reset
        setEmailForReset(data.email);
      })
      .catch(() => setNotification({ type: 'error', message: 'Erro ao carregar perfil.' }))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setNotification(null);
    try {
      await updateCurrentUser(form);
      setNotification({ type: 'success', message: 'Perfil atualizado com sucesso.' });
      onSaved();   // não passa parâmetro
      onClose();
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Erro ao atualizar perfil.';
      setNotification({ type: 'error', message: detail });
    }
  };

  const clearResetFields = () => {
    setCode('');
    setNewPassword('');
    setResetNotification(null);
  };

  const handleForgot = async (e: FormEvent) => {
    e.preventDefault();
    setResetNotification(null);
    try {
      await forgotPasswordUser(emailForReset);
      setResetNotification({ type: 'info', message: 'E-mail de redefinição enviado.' });
      setMode('reset');
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Erro ao enviar e-mail.';
      setResetNotification({ type: 'error', message: detail });
    }
  };

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    setResetNotification(null);
    try {
      await resetPasswordUser(code, newPassword);
      setResetNotification({ type: 'success', message: 'Senha redefinida com sucesso!' });
      clearResetFields();
      setMode('forgot');
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Erro na redefinição.';
      setResetNotification({ type: 'error', message: detail });
    }
  };

  if (loading) return <p>Carregando...</p>;

  return (
    <div>
      {/* === Form de edição de perfil === */}
      <form onSubmit={handleSubmit} className={editStyles.form}>
        {notification && (
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}

        <div className={editStyles.background}>
          <FloatingLabelInput
            id="field-name"
            name="name"
            label="Nome"
            value={form.name ?? ''}
            onChange={handleChange}
            required
          />

          <FloatingLabelInput
            id="field-email"
            name="email"
            label="E-mail"
            type="email"
            value={form.email ?? ''}
            onChange={handleChange}
            required
          />

          <FloatingLabelInput
            id="field-phone"
            name="phone"
            label="Telefone"
            value={form.phone ?? ''}
            onChange={handleChange}
          />

          <div className={editStyles.buttons}>
            <Button type="submit">Salvar</Button>
            <Button type="button" bgColor="#AAA" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </div>

        
      </form>

      {/* === Form de redefinição de senha === */}
      <div className={editStyles.forgotBackground}>
        <form
          onSubmit={mode === 'forgot' ? handleForgot : handleReset}
          className={editStyles.form}
        >
          <h4 className={editStyles.title}>
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
              name="emailForReset"
              label="E-mail cadastrado"
              type="email"
              value={emailForReset}
              onChange={e => setEmailForReset(e.target.value)}
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

          <div className={editStyles.actions}>
            <Button type="submit">
              {mode === 'forgot' ? 'Enviar código' : 'Redefinir senha'}
            </Button>
          </div>

          {mode === 'reset' && (
            <div className={editStyles.link}>
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

// src/components/AddAddressForm/AddAddressForm.tsx
'use client';

import { useState } from 'react';
import type { AddressCreate, AddressRead } from '@/types/address';
import { createAddress } from '@/services/addressService';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import Button from '@/components/Button/Button';
import Notification from '@/components/Notification/Notification';
import styles from './AddAddressForm.module.css';

interface AddAddressFormProps {
  onSuccess: (newAddress: AddressRead) => void;
}

/* ─── helpers ──────────────────────────────────────────────────────────── */
type ErrorWithMessage = {
  response?: {
    data?: {
      message?: unknown;
    };
  };
};

function hasErrorMessage(err: unknown): err is ErrorWithMessage {
  return (
    typeof err === 'object' &&
    err !== null &&
    'response' in err &&
    typeof (err as ErrorWithMessage).response?.data?.message === 'string'
  );
}

/* ─── componente ───────────────────────────────────────────────────────── */
export default function AddAddressForm({ onSuccess }: AddAddressFormProps) {
  /* estado do formulário */
  const [form, setForm] = useState<AddressCreate>({
    postal_code: '',
    street: '',
    number: '',
    neighborhood: '',
    complement: '',
    city: '',
    state: '',
    country: 'Brasil',
    is_selected: false,
  });

  /* estado de UI */
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cepError, setCepError] = useState<string | null>(null);

  /* lista de UF */
  const states = [
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
    'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
    'RS','RO','RR','SC','SP','SE','TO',
  ];

  /* ── handlers ──────────────────────────────────────────────────────── */
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      // 🔑 garante ao TS que só aqui temos um HTMLInputElement com .checked
      const { checked } = e.target as HTMLInputElement;
      setForm(prev => ({ ...prev, [name]: checked }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  }

  async function handleCepBlur() {
    const raw = form.postal_code.replace(/\D/g, '');
    if (raw.length !== 8) return;

    try {
      setCepError(null);
      const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
      const data: unknown = await res.json();

      if (
        typeof data === 'object' &&
        data !== null &&
        'erro' in data &&
        (data as { erro: boolean }).erro
      ) {
        setCepError('CEP não encontrado');
        return;
      }

      const viaCep = data as {
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };

      setForm(prev => ({
        ...prev,
        street: viaCep.logradouro ?? '',
        neighborhood: viaCep.bairro ?? '',
        city: viaCep.localidade ?? '',
        state: viaCep.uf ?? '',
      }));
    } catch {
      setCepError('Erro ao buscar CEP');
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await createAddress(form);
      onSuccess(res.data);
    } catch (err: unknown) {
      const message = hasErrorMessage(err)
        ? (err.response!.data!.message as string)
        : 'Erro ao criar endereço.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  /* ── render ─────────────────────────────────────────────────────────── */
  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {cepError && (
        <Notification
          type="error"
          message={cepError}
          onClose={() => setCepError(null)}
        />
      )}

      {error && (
        <Notification
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      <FloatingLabelInput
        id="postal_code"
        name="postal_code"
        label="CEP"
        value={form.postal_code}
        onChange={handleChange}
        onBlur={handleCepBlur}
        required
      />

      <FloatingLabelInput
        id="street"
        name="street"
        label="Rua"
        value={form.street}
        onChange={handleChange}
        required
      />

      <div className={styles.flex}>
        <FloatingLabelInput
          id="number"
          name="number"
          label="Número"
          value={form.number}
          onChange={handleChange}
          required
        />

        <FloatingLabelInput
          id="neighborhood"
          name="neighborhood"
          label="Bairro"
          value={form.neighborhood}
          onChange={handleChange}
          required
        />
      </div>

      <div className={styles.flex}>
        <FloatingLabelInput
          id="city"
          name="city"
          label="Cidade"
          value={form.city}
          onChange={handleChange}
          required
        />

        <label className={styles.field}>
          <select
            name="state"
            value={form.state}
            onChange={handleChange}
            required
          >
            <option value="">Estado</option>
            {states.map(sigla => (
              <option key={sigla} value={sigla}>
                {sigla}
              </option>
            ))}
          </select>
        </label>
      </div>

      <FloatingLabelInput
        id="complement"
        name="complement"
        label="Complemento (opcional)"
        value={form.complement}
        onChange={handleChange}
      />

      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          name="is_selected"
          checked={form.is_selected}
          onChange={handleChange}
        />
        Definir como endereço principal
      </label>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Salvando...' : 'Salvar'}
      </Button>
    </form>
  );
}

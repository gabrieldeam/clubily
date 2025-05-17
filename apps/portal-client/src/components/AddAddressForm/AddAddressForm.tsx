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

export default function AddAddressForm({ onSuccess }: AddAddressFormProps) {
  const [form, setForm] = useState<AddressCreate>({
    postal_code: '',
    street: '',
    city: '',
    state: '',
    country: 'Brasil',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cepError, setCepError] = useState<string | null>(null);

  const states = [
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
    'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
    'RS','RO','RR','SC','SP','SE','TO'
  ];

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleCepBlur() {
    const raw = form.postal_code.replace(/\D/g, '');
    if (raw.length !== 8) return;
    try {
      setCepError(null);
      const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
      const data = await res.json();
      if (data.erro) {
        setCepError('CEP não encontrado');
        return;
      }
      setForm(prev => ({
        ...prev,
        street: data.logradouro || '',
        city: data.localidade || '',
        state: data.uf || '',
      }));
    } catch {
      setCepError('Erro ao buscar CEP');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await createAddress(form);
      onSuccess(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar endereço.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2>Adicionar endereço</h2>

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

      {/* 1) CEP primeiro */}
      <FloatingLabelInput
        id="postal_code"
        name="postal_code"
        label="CEP"
        value={form.postal_code}
        onChange={handleChange}
        onBlur={handleCepBlur}
        required
      />

      {/* 2) Rua */}
      <FloatingLabelInput
        id="street"
        name="street"
        label="Rua"
        value={form.street}
        onChange={handleChange}
        required
      />

      {/* 3) Cidade */}
      <div className={styles.flex}>
        <FloatingLabelInput
            id="city"
            name="city"
            label="Cidade"
            value={form.city}
            onChange={handleChange}
            required
        />

        {/* 4) Estado – select */}
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

      {/* 5) País */}
      <FloatingLabelInput
        id="country"
        name="country"
        label="País"
        value={form.country}
        onChange={handleChange}
      />

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Salvando...' : 'Salvar'}
      </Button>
    </form>
  );
}

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
    number: '',
    neighborhood: '',
    complement: '',
    city: '',
    state: '',
    country: 'Brasil',
    is_selected: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cepError, setCepError] = useState<string | null>(null);

  const states = [
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
    'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
    'RS','RO','RR','SC','SP','SE','TO'
  ];

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;

  // Se for um input de checkbox, fazemos cast para HTMLInputElement para acessar `checked`.
  if (
    e.target instanceof HTMLInputElement &&
    e.target.type === 'checkbox'
  ) {
   const checkboxTarget = e.target as HTMLInputElement;
    setForm(prev => ({
      ...prev,
      [name]: checkboxTarget.checked,
    }));
  } else {
    // Caso contrário, pegamos `value` normalmente (select ou input text)
    setForm(prev => ({
      ...prev,
      [name]: value,
    }));
  }
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
        neighborhood: data.bairro || '',
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

      {/* 1) CEP */}
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

      <div className={styles.flex}>
        {/* 3) Número */}
        <FloatingLabelInput
          id="number"
          name="number"
          label="Número"
          value={form.number}
          onChange={handleChange}
          required
        />

        {/* 4) Bairro */}
        <FloatingLabelInput
          id="neighborhood"
          name="neighborhood"
          label="Bairro"
          value={form.neighborhood}
          onChange={handleChange}
          required
        />
      </div>      

      {/* 6) Cidade e Estado */}
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

      {/* 7) País */}
      {/* <FloatingLabelInput
        id="country"
        name="country"
        label="País"
        value={form.country}
        onChange={handleChange}
        required
      /> */}

      {/* 5) Complemento (opcional) */}
      <FloatingLabelInput
        id="complement"
        name="complement"
        label="Complemento (opcional)"
        value={form.complement}
        onChange={handleChange}
      />

      {/* 8) Checkbox para “Endereço principal” (is_selected) */}
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          name="is_selected"
          checked={!!form.is_selected}
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

'use client';

import { FormEvent, useState } from 'react';
import { registerCompany } from '@/services/companyService';
import type { CompanyCreate } from '@/types/company';

export default function RegisterForm() {
  const [form, setForm] = useState<CompanyCreate>({
    name: '',
    email: '',
    phone: '',
    cnpj: '',
    street: '',
    city: '',
    state: '',
    postal_code: '',
    description: '',
    password: '',
    accepted_terms: false,
  });
  const [message, setMessage] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    // força o tipo de target para HTMLInputElement
    const target = e.target as HTMLInputElement;
    const { name, type, value, checked } = target;

    setForm(prev => ({
      ...prev,
      // se for checkbox, usa checked, senão usa o value
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      await registerCompany(form);
      setMessage('Cadastro realizado! Verifique seu e-mail para confirmação.');
      setForm(prev => ({ ...prev, password: '' }));
    } catch (err) {
      console.error(err);
      setMessage('Erro no cadastro. Tente novamente.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Cadastro</h2>
      {message && <p>{message}</p>}

      <input name="name"        placeholder="Nome"        value={form.name}        onChange={handleChange} required />
      <input name="email"       type="email"          placeholder="E-mail"      value={form.email}       onChange={handleChange} required />
      <input name="phone"       placeholder="Telefone"    value={form.phone}       onChange={handleChange} required />
      <input name="cnpj"        placeholder="CNPJ (14 dígitos)" value={form.cnpj}    onChange={handleChange} required />
      <input name="street"      placeholder="Rua"         value={form.street}      onChange={handleChange} required />
      <input name="city"        placeholder="Cidade"      value={form.city}        onChange={handleChange} required />
      <input name="state"       placeholder="Estado"      value={form.state}       onChange={handleChange} required />
      <input name="postal_code" placeholder="CEP"         value={form.postal_code} onChange={handleChange} required />
      
      <textarea
        name="description"
        placeholder="Descrição"
        value={form.description}
        onChange={handleChange}
      />

      <input
        name="password"
        type="password"
        placeholder="Senha (mín. 8)"
        value={form.password}
        onChange={handleChange}
        required
      />

      <label>
        <input
          name="accepted_terms"
          type="checkbox"
          checked={form.accepted_terms}
          onChange={handleChange}
        />{' '}
        Aceito os termos
      </label>

      <button type="submit">Registrar</button>
    </form>
  );
}

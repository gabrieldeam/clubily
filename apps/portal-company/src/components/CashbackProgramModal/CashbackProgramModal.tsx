// src/components/CashbackProgramModal/CashbackProgramModal.tsx
'use client';

import { FormEvent, useState, useEffect } from 'react';
import styles from './CashbackProgramModal.module.css';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import Button from '@/components/Button/Button';
import Notification from '@/components/Notification/Notification';
import type {
  CashbackProgramRead,
  CashbackProgramCreate,
} from '@/types/cashbackProgram';

interface Props {
  program: CashbackProgramRead | null;
  onSave: (data: CashbackProgramCreate, id?: string) => void;
  onCancel: () => void;
}

export default function CashbackProgramModal({
  program,
  onSave,
  onCancel,
}: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [percent, setPercent] = useState(0);
  const [validityDays, setValidityDays] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [notification, setNotification] = useState<{type:string;message:string}|null>(null);

  // opção: 'max' | 'min'
  const [mode, setMode] = useState<'max'|'min'>('max');
  const [maxPerUser, setMaxPerUser] = useState<number>(1);
  const [minCashbackPerUser, setMinCashbackPerUser] = useState<number>(0);

  // contador
  const [descCount, setDescCount] = useState(0);

  useEffect(() => {
    if (program) {
      setName(program.name);
      setDescription(program.description);
      setPercent(program.percent);
      setValidityDays(program.validity_days);
      setIsActive(program.is_active);
      setIsVisible(program.is_visible);
      setMode(program.max_per_user != null ? 'max' : 'min');
      setMaxPerUser(program.max_per_user ?? 1);
      setMinCashbackPerUser(program.min_cashback_per_user ?? 0);
      setDescCount(program.description.length);
    }
  }, [program]);

  const handleDescChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v.length <= 200) {
      setDescription(v);
      setDescCount(v.length);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (
      !name ||
      !description ||
      percent < 0 || percent > 100 ||
      validityDays < 1 ||
      (mode === 'max' ? maxPerUser < 1 : minCashbackPerUser < 0)
    ) {
      setNotification({ type:'error', message:'Preencha todos os campos corretamente' });
      return;
    }
    const payload: CashbackProgramCreate = {
      name,
      description,
      percent,
      validity_days: validityDays,
      is_active: isActive,
      is_visible: isVisible,
      max_per_user: mode === 'max' ? maxPerUser : undefined,
      min_cashback_per_user: mode === 'min' ? minCashbackPerUser : undefined,
    };
    onSave(payload, program?.id);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.title}>
        {program ? 'Editar Programa' : 'Novo Programa'}
      </h2>
      {notification && (
        <Notification
          type={notification.type as 'error'}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <FloatingLabelInput
        id="prog-name"
        name="name"
        label="Nome"
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
      />

      <FloatingLabelInput
        id="prog-desc"
        name="description"
        label="Descrição"
        type="text"
        value={description}
        onChange={handleDescChange}
      />
      <div className={styles.charCount}>{descCount}/200 caracteres</div>

      <FloatingLabelInput
        id="prog-percent"
        name="percent"
        label="Percentual (%)"
        type="number"
        value={percent.toString()}
        onChange={e => setPercent(parseFloat(e.target.value))}
      />

      <FloatingLabelInput
        id="prog-validity_days"
        name="validity_days"
        label="Validade (dias)"
        type="number"
        value={validityDays.toString()}
        onChange={e => setValidityDays(Number(e.target.value))}
      />

      <div className={styles.switches}>
        <label>
          <input
            type="checkbox"
            checked={isActive}
            onChange={e => setIsActive(e.target.checked)}
          /> Ativo
        </label>
        <label>
          <input
            type="checkbox"
            checked={isVisible}
            onChange={e => setIsVisible(e.target.checked)}
          /> Visível
        </label>
      </div>

      <div className={styles.optionGroup}>
        <label className={styles.option}>
          <input
            type="radio"
            checked={mode === 'max'}
            onChange={() => setMode('max')}
          /> Máximo de usos por usuário
        </label>
        <label className={styles.option}>
          <input
            type="radio"
            checked={mode === 'min'}
            onChange={() => setMode('min')}
          /> Mínimo de cashback por usuário
        </label>
      </div>

      <div className={styles.inputGroup}>
        {mode === 'max' ? (
          <FloatingLabelInput
            id="prog-max"
            name="max_per_user"
            label="Usos máximos"
            type="number"
            value={maxPerUser.toString()}
            onChange={e => setMaxPerUser(Number(e.target.value))}
            min={1}
          />
        ) : (
          <FloatingLabelInput
            id="prog-min"
            name="min_cashback_per_user"
            label="Cashback mínimo (R$)"
            type="number"
            value={minCashbackPerUser.toString()}
            onChange={e => setMinCashbackPerUser(parseFloat(e.target.value))}
            min={0}
            step="0.01"
          />
        )}
      </div>

      <div className={styles.actions}>
        <Button type="submit">Salvar</Button>
        <Button bgColor="#AAA" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}

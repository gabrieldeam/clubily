'use client';

import { FormEvent, useState, useEffect, useRef, useMemo } from 'react';
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
  // estados do formulário
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [percent, setPercent] = useState(0);
  const [validityDays, setValidityDays] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [mode, setMode] = useState<'max' | 'min' | 'none'>('none');
  const [maxPerUser, setMaxPerUser] = useState(1);
  const [minCashbackPerUser, setMinCashbackPerUser] = useState(0);
  const [descCount, setDescCount] = useState(0);
  const [notification, setNotification] = useState<{ type: string; message: string } | null>(null);

  // chave única por programa (ou "new" se for criação)
  const DRAFT_KEY = useMemo(
    () => `cashbackProgramModalDraft-${program?.id ?? 'new'}`,
    [program?.id]
  );

  const isFirstRun = useRef(true);

  // 1) ao montar: restaura de `program` (se editando) ou de localStorage (se criando)
  useEffect(() => {
    isFirstRun.current = true;

    if (program) {
      // edição: carrega valores do programa existente
      setName(program.name);
      setDescription(program.description);
      setPercent(program.percent);
      setValidityDays(program.validity_days);
      setIsActive(program.is_active);
      setIsVisible(program.is_visible);
      setDescCount(program.description.length);

      if (program.max_per_user != null) {
        setMode('max');
        setMaxPerUser(program.max_per_user);
      } else if (program.min_cashback_per_user != null) {
        setMode('min');
        setMinCashbackPerUser(program.min_cashback_per_user);
      } else {
        setMode('none');
        setMaxPerUser(1);
        setMinCashbackPerUser(0);
      }

    } else {
      // criação: tenta carregar rascunho
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        try {
          const {
            name: dn,
            description: dd,
            percent: dp,
            validityDays: dv,
            isActive: da,
            isVisible: dvz,
            mode: dm,
            maxPerUser: dmax,
            minCashbackPerUser: dmin,
            descCount: dc,
          } = JSON.parse(draft);

          setName(dn);
          setDescription(dd);
          setPercent(dp);
          setValidityDays(dv);
          setIsActive(da);
          setIsVisible(dvz);
          setMode(dm);
          setMaxPerUser(dmax);
          setMinCashbackPerUser(dmin);
          setDescCount(dc);
        } catch {
          // rascunho inválido: deixa padrões
        }
      }
    }
  }, [program, DRAFT_KEY]);

  // 2) salva draft a cada mudança (somente em criação)
  useEffect(() => {
    if (program) return;             // não grava no modo edição
    if (isFirstRun.current) {        // pula na montagem inicial
      isFirstRun.current = false;
      return;
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      name,
      description,
      percent,
      validityDays,
      isActive,
      isVisible,
      mode,
      maxPerUser,
      minCashbackPerUser,
      descCount,
    }));
  }, [
    DRAFT_KEY,
    name,
    description,
    percent,
    validityDays,
    isActive,
    isVisible,
    mode,
    maxPerUser,
    minCashbackPerUser,
    descCount,
    program,
  ]);

  // manipulador de textarea para descrição
  const handleDescChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v.length <= 200) {
      setDescription(v);
      setDescCount(v.length);
    }
  };

  // 3) ao submeter, limpa rascunho
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // validação
    if (
      !name ||
      !description ||
      percent < 0 || percent > 100 ||
      validityDays < 1 ||
      (mode === 'max' ? maxPerUser < 1 :
        mode === 'min' ? minCashbackPerUser < 0 : false)
    ) {
      setNotification({ type: 'error', message: 'Preencha todos os campos corretamente' });
      return;
    }

    const payload: CashbackProgramCreate = {
      name,
      description,
      percent,
      validity_days: validityDays,
      is_active: isActive,
      is_visible: isVisible,
      ...(mode === 'max' && { max_per_user: maxPerUser }),
      ...(mode === 'min' && { min_cashback_per_user: minCashbackPerUser }),
    };

    onSave(payload, program?.id);

    // limpa draft
    localStorage.removeItem(DRAFT_KEY);
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
          />{' '}
          Ativo
        </label>
        <label>
          <input
            type="checkbox"
            checked={isVisible}
            onChange={e => setIsVisible(e.target.checked)}
          />{' '}
          Visível
        </label>
      </div>

      <div className={styles.optionGroup} role="radiogroup" aria-label="Modo de limite">
        <button
          type="button"
          role="radio"
          aria-checked={mode === 'max'}
          className={`${styles.option} ${mode === 'max' ? styles.optionSelected : ''}`}
          onClick={() => setMode(mode === 'max' ? 'none' : 'max')}
        >
          Máximo de usos por usuário
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={mode === 'min'}
          className={`${styles.option} ${mode === 'min' ? styles.optionSelected : ''}`}
          onClick={() => setMode(mode === 'min' ? 'none' : 'min')}
        >
          Mínimo de cashback por usuário
        </button>
      </div>

      <div className={styles.inputGroup}>
        {mode === 'max' && (
          <FloatingLabelInput
            id="prog-max"
            name="max_per_user"
            label="Usos máximos"
            type="number"
            value={maxPerUser.toString()}
            onChange={e => setMaxPerUser(Number(e.target.value))}
            min={1}
          />
        )}

        {mode === 'min' && (
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

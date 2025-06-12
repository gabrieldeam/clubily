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
  const [description, setDescription] = useState('');
  const [percent, setPercent] = useState(0);
  const [validityDays, setValidityDays] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [notification, setNotification] = useState<{type:string;message:string}|null>(null);

  // contador de caracteres
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    if (program) {
      setDescription(program.description);
      setPercent(program.percent);
      setValidityDays(program.validity_days);
      setIsActive(program.is_active);
      setIsVisible(program.is_visible);
      setCharCount(program.description.length);
    }
  }, [program]);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length <= 200) {
      setDescription(val);
      setCharCount(val.length);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!description || percent < 0 || percent > 100 || validityDays < 1) {
      setNotification({type:'error',message:'Preencha todos os campos corretamente'});
      return;
    }
    onSave(
      {
        description,
        percent,
        validity_days: validityDays,
        is_active: isActive,
        is_visible: isVisible,
      },
      program?.id
    );
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
        id="prog-desc"
        name="description"
        label="Descrição"
        type="text"
        value={description}
        onChange={handleDescriptionChange}
        maxLength={200}
      />
      <div className={styles.charCount}>{charCount}/200 caracteres</div>
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
      <div className={styles.actions}>
        <Button type="submit">Salvar</Button>
        <Button bgColor="#AAA" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}

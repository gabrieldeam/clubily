'use client';

import { useState, FormEvent, useEffect } from 'react';
import type { TemplateRead, TemplateCreate } from '@/types/loyalty';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import Button from '@/components/Button/Button';
import styles from './LoyaltyTemplateModal.module.css';

interface Props {
  template: TemplateRead | null;
  onSave: (data: TemplateCreate, iconFile?: File, id?: string) => void;
  onCancel: () => void;
}

export default function LoyaltyTemplateModal({ template, onSave, onCancel }: Props) {
  const [title, setTitle] = useState('');
  const [promo, setPromo] = useState('');
  const [stampTotal, setStampTotal] = useState(10);
  const [colorPrimary, setColorPrimary] = useState('#ffa600');
  const [colorBg, setColorBg] = useState('#ffffff');
  const [perLimit, setPerLimit] = useState(1);
  const [emissionLimit, setEmissionLimit] = useState<number | ''>('');
  const [active, setActive] = useState(true);
  const [iconFile, setIconFile] = useState<File>();
  const [emissionStart, setEmissionStart] = useState<string | undefined>();
  const [emissionEnd, setEmissionEnd] = useState<string | undefined>();

  /* ───────── carregar valores ao editar ───────── */
  useEffect(() => {
    if (template) {
      setTitle(template.title);
      setPromo(template.promo_text || '');
      setStampTotal(template.stamp_total);
      setColorPrimary(template.color_primary || '#ffa600');
      setColorBg(template.color_bg || '#ffffff');
      setPerLimit(template.per_user_limit || 1);
      setEmissionLimit(template.emission_limit ?? '');
      setActive(template.active ?? true);

      // formata "YYYY-MM-DDTHH:mm" para os inputs datetime-local
      setEmissionStart(
        template.emission_start ? template.emission_start.substring(0, 16) : undefined
      );
      setEmissionEnd(
        template.emission_end ? template.emission_end.substring(0, 16) : undefined
      );

      setIconFile(undefined);
    } else {
      setTitle('');
      setPromo('');
      setStampTotal(10);
      setColorPrimary('#ffa600');
      setColorBg('#ffffff');
      setPerLimit(1);
      setEmissionLimit('');
      setActive(true);
      setEmissionStart(undefined);
      setEmissionEnd(undefined);
      setIconFile(undefined);
    }
  }, [template]);

  /* ───────── submit ───────── */
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const payload: TemplateCreate = {
      title,
      promo_text: promo || null,
      stamp_total: stampTotal,
      color_primary: colorPrimary,
      color_bg: colorBg,
      per_user_limit: perLimit,
      emission_start: emissionStart || null,
      emission_end: emissionEnd || null,
      emission_limit: emissionLimit === '' ? null : Number(emissionLimit),
      active,
    };
    onSave(payload, iconFile, template?.id);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2>{template ? 'Editar Cartão' : 'Novo Cartão'}</h2>

      <FloatingLabelInput
        label="Título"
        value={title}
        onChange={e => setTitle(e.target.value)}
        maxLength={50}
      />

      <FloatingLabelInput
        label="Texto promocional"
        value={promo}
        onChange={e => setPromo(e.target.value)}
        maxLength={120}
      />

      <div className={styles.row}>
        <FloatingLabelInput
          type="number"
          label="Total de carimbos"
          value={stampTotal}
          onChange={e => setStampTotal(Number(e.target.value))}
        />
        <FloatingLabelInput
          type="number"
          label="Limite por usuário"
          value={perLimit}
          onChange={e => setPerLimit(Number(e.target.value))}
        />
      </div>

      <FloatingLabelInput
        type="number"
        label="Limite total de emissões (opcional)"
        value={emissionLimit}
        onChange={e => {
          const val = e.target.value;
          setEmissionLimit(val === '' ? '' : Number(val));
        }}
      />

      <div className={styles.colorRow}>
        <div className={styles.colorInput}>
          <label htmlFor="colorPrimary">Cor primária</label>
          <div className={styles.colorPicker}>
            <input
              id="colorPrimary"
              type="color"
              value={colorPrimary}
              onChange={e => setColorPrimary(e.target.value)}
              className={styles.colorSwatch}
            />
            <input
              type="text"
              value={colorPrimary}
              onChange={e => setColorPrimary(e.target.value)}
              className={styles.colorText}
            />
          </div>
        </div>
        <div className={styles.colorInput}>
          <label htmlFor="colorBg">Cor de fundo</label>
          <div className={styles.colorPicker}>
            <input
              id="colorBg"
              type="color"
              value={colorBg}
              onChange={e => setColorBg(e.target.value)}
              className={styles.colorSwatch}
            />
            <input
              type="text"
              value={colorBg}
              onChange={e => setColorBg(e.target.value)}
              className={styles.colorText}
            />
          </div>
        </div>
      </div>

      <FloatingLabelInput
        label="Início da emissão"
        id="emissionStart"
        type="datetime-local"
        value={emissionStart || ''}
        onChange={e => setEmissionStart(e.target.value)}
      />
      <FloatingLabelInput
        label="Fim da emissão"
        id="emissionEnd"
        type="datetime-local"
        value={emissionEnd || ''}
        onChange={e => setEmissionEnd(e.target.value)}
      />

      <div className={styles.field}>
        <label>Ícone de carimbo</label>
        <input
          type="file"
          accept="image/*"
          onChange={e => setIconFile(e.target.files?.[0])}
        />
        {template?.stamp_icon_url && (
          <img
            src={`${process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL}${template.stamp_icon_url}`}
            className={styles.preview}
          />
        )}
      </div>

      <label className={styles.switch}>
        <input
          type="checkbox"
          checked={active}
          onChange={e => setActive(e.target.checked)}
        />
        Ativo
      </label>

      <div className={styles.actions}>
        <Button type="submit">Salvar</Button>
        <Button
          bgColor="#f3f4f6"
          style={{ color: '#374151' }}
          onClick={onCancel}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}

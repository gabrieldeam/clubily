// src/components/LoyaltyTemplateModal/LoyaltyTemplateModal.tsx
'use client';

import { useState, FormEvent, useEffect, useRef } from 'react';
import Image from 'next/image';
import type { TemplateRead, TemplateCreate } from '@/types/loyalty';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import Button from '@/components/Button/Button';
import styles from './LoyaltyTemplateModal.module.css';

// 👉 novo: cropper 1:1 reutilizável
import ImagePickerSquare from '@/components/ImagePickerSquare/ImagePickerSquare';

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
  const [iconFile, setIconFile] = useState<File | undefined>(undefined);
  const [iconPreview, setIconPreview] = useState<string | undefined>(undefined);
  const [emissionStart, setEmissionStart] = useState<string | undefined>();
  const [emissionEnd, setEmissionEnd] = useState<string | undefined>();

  // rascunho
  const DRAFT_KEY = 'loyaltyTemplateModalDraft';
  const isFirstRun = useRef(true);

  // 1) restauração
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
      setEmissionStart(template.emission_start?.substring(0, 16));
      setEmissionEnd(template.emission_end?.substring(0, 16));
      setIconFile(undefined);
      setIconPreview(
        template.stamp_icon_url
          ? `${process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL}${template.stamp_icon_url}`
          : undefined
      );
    } else {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        const {
          title: dTitle,
          promo: dPromo,
          stampTotal: dStamp,
          colorPrimary: dPrim,
          colorBg: dBg,
          perLimit: dPer,
          emissionLimit: dEmitLim,
          active: dAct,
          emissionStart: dEmitStart,
          emissionEnd: dEmitEnd,
        } = JSON.parse(draft);
        setTitle(dTitle);
        setPromo(dPromo);
        setStampTotal(dStamp);
        setColorPrimary(dPrim);
        setColorBg(dBg);
        setPerLimit(dPer);
        setEmissionLimit(dEmitLim);
        setActive(dAct);
        setEmissionStart(dEmitStart);
        setEmissionEnd(dEmitEnd);
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
      }
      setIconFile(undefined);
      setIconPreview(undefined);
    }
  }, [template, DRAFT_KEY]);

  // 2) salvamento automático
  useEffect(() => {
    if (template) return;
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        title,
        promo,
        stampTotal,
        colorPrimary,
        colorBg,
        perLimit,
        emissionLimit,
        active,
        emissionStart,
        emissionEnd,
      })
    );
  }, [
    title,
    promo,
    stampTotal,
    colorPrimary,
    colorBg,
    perLimit,
    emissionLimit,
    active,
    emissionStart,
    emissionEnd,
    template,
  ]);

  // 3) submit e limpeza de rascunho
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
    if (!template) localStorage.removeItem(DRAFT_KEY);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2>{template ? 'Editar Cartão' : 'Novo Cartão'}</h2>

      <FloatingLabelInput
        label="Título"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={50}
      />

      <FloatingLabelInput
        label="Texto promocional"
        value={promo}
        onChange={(e) => setPromo(e.target.value)}
        maxLength={120}
      />

      <div className={styles.row}>
        <FloatingLabelInput
          type="number"
          label="Total de carimbos"
          value={stampTotal}
          onChange={(e) => setStampTotal(Number(e.target.value))}
        />
        <FloatingLabelInput
          type="number"
          label="Limite por usuário"
          value={perLimit}
          onChange={(e) => setPerLimit(Number(e.target.value))}
        />
      </div>

      <FloatingLabelInput
        type="number"
        label="Limite total de emissões (opcional)"
        value={emissionLimit}
        onChange={(e) => {
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
              onChange={(e) => setColorPrimary(e.target.value)}
              className={styles.colorSwatch}
            />
            <input
              type="text"
              value={colorPrimary}
              onChange={(e) => setColorPrimary(e.target.value)}
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
              onChange={(e) => setColorBg(e.target.value)}
              className={styles.colorSwatch}
            />
            <input
              type="text"
              value={colorBg}
              onChange={(e) => setColorBg(e.target.value)}
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
        onChange={(e) => setEmissionStart(e.target.value)}
      />
      <FloatingLabelInput
        label="Fim da emissão"
        id="emissionEnd"
        type="datetime-local"
        value={emissionEnd || ''}
        onChange={(e) => setEmissionEnd(e.target.value)}
      />

      <div className={styles.field}>
        <label>Ícone de carimbo</label>

        {/* preview (template existente ou nova imagem cortada) */}
        {iconPreview && (
          <div className={styles.previewWrap}>
            <Image
              src={iconPreview}
              alt="Ícone de carimbo"
              fill
              sizes="60px"
              className={styles.previewImg}
            />
          </div>
        )}

        {/* botão que abre a modal de recorte 1:1 */}
        <ImagePickerSquare
          buttonLabel={template ? 'Trocar ícone' : 'Escolher ícone'}
          stageSize={320}
          outputSize={256}           // ícone fica leve e nítido
          outputFileName="stamp-icon.jpg"
          outputType="image/jpeg"    // fundo branco garantido
          onCropped={(file, dataUrl) => {
            setIconFile(file);
            setIconPreview(dataUrl);
          }}
        />
      </div>

      <label className={styles.switch}>
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
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

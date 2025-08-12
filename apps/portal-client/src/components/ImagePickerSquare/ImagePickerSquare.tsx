'use client';

import { useRef, useState } from 'react';
import ImageCropperSquare from '@/components/ImageCropperSquare/ImageCropperSquare';
import styles from './ImagePickerSquare.module.css';

interface Props {
  /** Rótulo do botão */
  buttonLabel?: string;
  /** Dispara quando o recorte for concluído */
  onCropped: (file: File, dataUrl: string) => void;
  /** Tamanho do palco (UI) */
  stageSize?: number;
  /** Tamanho final do arquivo */
  outputSize?: number;
  /** Nome do arquivo final */
  outputFileName?: string;
  /** Tipo do arquivo final */
  outputType?: 'image/jpeg' | 'image/png';
  /** Qualidade JPEG (0–1) */
  jpegQuality?: number;
  /** Accept do input */
  accept?: string;
  /** Desabilita o botão */
  disabled?: boolean;
}

export default function ImagePickerSquare({
  buttonLabel = 'Escolher imagem',
  onCropped,
  stageSize = 360,
  outputSize = 512,
  outputFileName = 'image.jpg',
  outputType = 'image/jpeg',
  jpegQuality = 0.92,
  accept = 'image/*',
  disabled = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openFile = () => {
    if (disabled) return;
    setError(null);
    inputRef.current?.click();
  };

  const onChangeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('Selecione um arquivo de imagem válido.');
      e.target.value = '';
      return;
    }
    setFile(f);
    setOpen(true);
    e.target.value = ''; // permite reescolher o mesmo arquivo no futuro
  };

  const handleCropped = (croppedFile: File, dataUrl: string) => {
    onCropped(croppedFile, dataUrl);
  };

  return (
    <div className={styles.picker}>
      <button
        type="button"
        className={styles.button}
        onClick={openFile}
        disabled={disabled}
      >
        {buttonLabel}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={onChangeFile}
      />

      {error && <div className={styles.error}>{error}</div>}

      <ImageCropperSquare
        open={open}
        onClose={() => setOpen(false)}
        file={file}
        onCropped={handleCropped}
        stageSize={stageSize}
        outputSize={outputSize}
        outputType={outputType}
        jpegQuality={jpegQuality}
        outputFileName={outputFileName}
      />
    </div>
  );
}

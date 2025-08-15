// src/components/ImageCropperSquare/ImageCropperSquare.tsx
'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  type CSSProperties,
  type WheelEventHandler,
  type PointerEventHandler,
} from 'react';
import NextImage from 'next/image';
import Modal from '@/components/Modal/Modal';
import styles from './ImageCropperSquare.module.css';

type OutputType = 'image/jpeg' | 'image/png';

interface ImageCropperSquareProps {
  open: boolean;
  onClose: () => void;
  file: File | null;
  onCropped: (file: File, dataUrl: string) => void;
  /** Tamanho máximo desejado para desktop; no mobile será reduzido automaticamente */
  stageSize?: number;
  outputSize?: number;
  outputType?: OutputType;
  jpegQuality?: number;
  outputFileName?: string;
}

/**
 * Cropper 1:1 com pan/zoom, limites e export com fundo branco.
 * Compatível com mouse (drag + wheel) e touch (pinch + drag).
 * Responsivo: o "stage" se adapta ao viewport para não estourar a modal.
 */
export default function ImageCropperSquare({
  open,
  onClose,
  file,
  onCropped,
  stageSize = 360,
  outputSize = 512,
  outputType = 'image/jpeg',
  jpegQuality = 0.92,
  outputFileName = 'image.jpg',
}: ImageCropperSquareProps) {
  const imgUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  // dimensões naturais da imagem
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);

  // pan/zoom state
  const [zoom, setZoom] = useState(1); // multiplicador relativo ao minZoom (>= 1)
  const [minZoom, setMinZoom] = useState(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // viewport para responsividade
  const [viewport, setViewport] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  // pointers para touch/pinch
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStart = useRef<{ dist: number; zoom: number } | null>(null);
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  // ref para ler zoom em efeitos sem depender dele
  const zoomRef = useRef(1);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  // cleanup URL
  useEffect(() => {
    return () => {
      if (imgUrl) URL.revokeObjectURL(imgUrl);
    };
  }, [imgUrl]);

  // observar viewport apenas quando a modal estiver aberta
  useEffect(() => {
    if (!open) return;
    const update = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, [open]);

  // calcula stage *dinâmico* para caber no viewport (sem estourar a modal)
  const stageSide = useMemo(() => {
    // reservas aproximadas para cabeçalho/controles/rodapé da modal
    const verticalReserve = 320; // título, slider, botões, paddings
    const horizontalReserve = 48; // paddings da modal

    const vw = viewport.w || stageSize + 160;
    const vh = viewport.h || stageSize + verticalReserve;

    const availW = Math.max(220, vw - horizontalReserve);
    const availH = Math.max(220, vh - verticalReserve);

    const candidate = Math.min(stageSize, availW, availH);
    return Math.max(200, candidate); // nunca menor que 200px para usabilidade
  }, [viewport.w, viewport.h, stageSize]);

  // largura da modal: não excede viewport
  const modalWidth = useMemo(() => {
    const vw = viewport.w || stageSize + 160;
    const desired = stageSide + 160; // espaço p/ conteúdo ao redor
    return Math.min(desired, vw - 24); // margem lateral de segurança
  }, [viewport.w, stageSide, stageSize]);

  const currentScale = useMemo(
    () => (natural ? minZoom * zoom : 1),
    [natural, minZoom, zoom]
  );

  // helper para clamp com um scale específico (útil ao reagir a stageSide/minZoom)
  const clampOffsetWithScale = useCallback(
    (ox: number, oy: number, scale: number) => {
      if (!natural) return { x: 0, y: 0 };
      const scaledW = natural.w * scale;
      const scaledH = natural.h * scale;
      const maxX = Math.max((scaledW - stageSide) / 2, 0);
      const maxY = Math.max((scaledH - stageSide) / 2, 0);
      return {
        x: Math.max(-maxX, Math.min(maxX, ox)),
        y: Math.max(-maxY, Math.min(maxY, oy)),
      };
    },
    [natural, stageSide]
  );

  // limites de pan (garante cobertura do quadrado) usando o scale atual
  const clampOffset = useCallback(
    (ox: number, oy: number) => clampOffsetWithScale(ox, oy, currentScale),
    [clampOffsetWithScale, currentScale]
  );

  // carregar dimensões naturais e setar minZoom/zoom/offset
  useEffect(() => {
    if (!open || !imgUrl) return;
    const img = new window.Image();
    img.onload = () => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      setNatural({ w, h });

      // minZoom cobre o quadrado (cover) com o stage *dinâmico*
      const cover = Math.max(stageSide / w, stageSide / h);
      setMinZoom(cover);
      setZoom(1); // zoom relativo ao minZoom
      setOffset({ x: 0, y: 0 }); // centralizado
    };
    img.src = imgUrl;
  }, [imgUrl, open, stageSide]);

  // quando stageSide mudar (ex.: rotação mobile), revalida minZoom e offset
  useEffect(() => {
    if (!natural) return;
    const cover = Math.max(stageSide / natural.w, stageSide / natural.h);
    setMinZoom(cover);
    // Revalida offset pra não “escapar” com o novo scale
    setOffset((o) => clampOffsetWithScale(o.x, o.y, cover * zoomRef.current));
  }, [stageSide, natural, clampOffsetWithScale]);

  const onWheel: WheelEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    if (!natural) return;
    const delta = -e.deltaY * 0.001; // sensibilidade
    const nextZoom = Math.max(1, Math.min(8, zoom * (1 + delta)));
    setZoom(nextZoom);
  };

  const onPointerDown: PointerEventHandler<HTMLDivElement> = (e) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 1) {
      // drag
      dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    } else if (pointers.current.size === 2) {
      // pinch
      const pts = Array.from(pointers.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchStart.current = { dist, zoom };
      dragStart.current = null; // desliga drag
    }
  };

  const onPointerMove: PointerEventHandler<HTMLDivElement> = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchStart.current) {
      // pinch zoom
      const pts = Array.from(pointers.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const factor = dist / pinchStart.current.dist;
      const z = Math.max(1, Math.min(8, pinchStart.current.zoom * factor));
      setZoom(z);
    } else if (pointers.current.size === 1 && dragStart.current) {
      // drag pan
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      const next = clampOffset(dragStart.current.ox + dx, dragStart.current.oy + dy);
      setOffset(next);
    }
  };

  const finishPointer: PointerEventHandler<HTMLDivElement> = (e) => {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    if (pointers.current.has(e.pointerId)) {
      pointers.current.delete(e.pointerId);
    }
    if (pointers.current.size < 2) pinchStart.current = null;
    if (pointers.current.size < 1) dragStart.current = null;
  };

  const onPointerUp = finishPointer;
  const onPointerCancel = finishPointer;
  const onPointerLeave = finishPointer;

  const resetView = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const exportCropped = async () => {
    if (!natural || !imgUrl) return;

    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Sempre fundo branco (resolve PNG transparente)
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, outputSize, outputSize);

    const img = await loadImage(imgUrl);

    // Mapeamento do palco (stageSide) para o canvas (outputSize)
    const k = outputSize / stageSide;
    const scaledW = natural.w * currentScale;
    const scaledH = natural.h * currentScale;

    // top-left da imagem dentro do palco (ancorada no centro)
    const topLeftStageX = (stageSide - scaledW) / 2 + offset.x;
    const topLeftStageY = (stageSide - scaledH) / 2 + offset.y;

    const drawX = topLeftStageX * k;
    const drawY = topLeftStageY * k;
    const drawW = scaledW * k;
    const drawH = scaledH * k;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    const dataUrl =
      outputType === 'image/jpeg'
        ? canvas.toDataURL('image/jpeg', jpegQuality)
        : canvas.toDataURL('image/png');

    const blob = await canvasToBlob(canvas, outputType, jpegQuality);
    if (!blob) return;

    const fileOut = new File([blob], outputFileName, { type: outputType });
    onCropped(fileOut, dataUrl);
    onClose();
  };

  // estilo do wrapper transformável
  const imageWrapStyle = useMemo<CSSProperties>(() => {
    if (!natural) return { display: 'none' };
    return {
      transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${currentScale})`,
      width: `${natural.w}px`,
      height: `${natural.h}px`,
    };
  }, [natural, offset.x, offset.y, currentScale]);

  return (
    <Modal open={open} onClose={onClose} width={modalWidth}>
      <div className={styles.wrapper}>
        <h3 className={styles.title}>Ajuste e corte sua imagem (1:1)</h3>

        <div
          className={styles.stage}
          style={{ width: stageSide, height: stageSide }}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onPointerLeave={onPointerLeave}
        >
          {/* imagem com next/image dentro de um wrapper transformável */}
          {imgUrl && natural && (
            <div className={styles.imageWrap} style={imageWrapStyle}>
              <NextImage
                src={imgUrl}
                alt="Pré-visualização para corte"
                fill
                unoptimized
                draggable={false}
                style={{ pointerEvents: 'none' }}
                sizes={`${stageSide}px`}
                priority
              />
            </div>
          )}

          {/* máscara sutil nas bordas (opcional) */}
          <div className={styles.mask} aria-hidden />
        </div>

        <div className={styles.controls}>
          <label className={styles.sliderLabel}>
            Zoom
            <input
              type="range"
              min={1}
              max={8}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
            />
          </label>

          <button type="button" className={styles.secondaryBtn} onClick={resetView}>
            Recentralizar
          </button>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.secondaryBtn} onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className={styles.primaryBtn} onClick={exportCropped}>
            Concluir corte
          </button>
        </div>

        <p className={styles.hint}>
          Dica: arraste para posicionar, use a rodinha do mouse (ou pinça no celular) para dar zoom.
        </p>
      </div>
    </Modal>
  );
}

/* utils */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const i = new window.Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: OutputType,
  quality?: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (canvas.toBlob) {
      canvas.toBlob((b) => resolve(b), type, quality);
    } else {
      // fallback ultra-raro
      const dataUrl =
        type === 'image/jpeg' ? canvas.toDataURL(type, quality) : canvas.toDataURL(type);
      const byteString = atob(dataUrl.split(',')[1]);
      const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
      resolve(new Blob([ab], { type: mimeString }));
    }
  });
}

// Modal.tsx
'use client';

import { ReactNode, MouseEvent, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: string | number; // opcional, default 480px
}

export default function Modal({
  open,
  onClose,
  children,
  width = 480,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  // Garante que só monte o portal no client
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !open) return null;

  const stop = (e: MouseEvent) => e.stopPropagation();

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.content}
        style={{ maxWidth: width }}
        onClick={stop}
      >
        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Fechar"
        >
          ×
        </button>
        {children}
      </div>
    </div>,
    // monta diretamente no body, acima de qualquer stacking context
    document.body
  );
}

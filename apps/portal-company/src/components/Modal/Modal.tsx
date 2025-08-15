'use client';

import { ReactNode, MouseEvent } from 'react';
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
  if (!open) return null;

  const stop = (e: MouseEvent) => e.stopPropagation();

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.content}
        style={{ maxWidth: width }}
        onClick={stop}
        role="dialog"
        aria-modal="true"
      >
        <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
          ×
        </button>

        {/* Área rolável com “gutter” à direita para o botão */}
        <div className={styles.scrollArea}>
          {children}
        </div>
      </div>
    </div>
  );
}

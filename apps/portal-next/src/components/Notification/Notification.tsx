// src/components/Notification/Notification.tsx
import React from 'react';
import styles from './Notification.module.css';

type NotificationType = 'success' | 'error' | 'info';

interface NotificationProps {
  type?: NotificationType;
  message: string;
  onClose?: () => void;
}

export default function Notification({
  type = 'info',
  message,
  onClose,
}: NotificationProps) {
  return (
    <div className={`${styles.notification} ${styles[type]}`}>
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className={styles.closeButton}
          aria-label="Fechar"
        >
          ×
        </button>
      )}
    </div>
  );
}
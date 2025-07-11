// src/components/Button/Button.tsx
'use client';

import React, { ButtonHTMLAttributes, CSSProperties } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  bgColor?: string;
  style?: CSSProperties;
}

export default function Button({ children, bgColor, style, ...props }: ButtonProps) {
  const combinedStyle: CSSProperties = {
    ...(bgColor ? { backgroundColor: bgColor } : {}),
    ...style,
  };

  return (
    <button
      className={styles.button}
      style={combinedStyle}
      {...props}
    >
      {children}
    </button>
  );
}
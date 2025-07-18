// src/components/FloatingLabelInput/FloatingLabelInput.tsx
'use client';

import React, { InputHTMLAttributes, useState } from 'react';
import styles from './FloatingLabelInput.module.css';

interface FloatingLabelInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  showPassword?: boolean;
}

export default function FloatingLabelInput({ label, id, type = 'text', value, onChange, maxLength, showPassword, ...rest }: FloatingLabelInputProps) {
  const [focused, setFocused] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;
  const hasValue = !!value?.toString().length;
  const currentLength = value?.toString().length || 0;

  return (
    <div className={`${styles.container} ${(focused || hasValue) ? styles.filled : ''}`}>
      <input
        id={id}
        type={inputType}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder=" "
        className={styles.input}
        maxLength={maxLength}
        {...rest}
      />
      <label htmlFor={id} className={styles.label}>{label}</label>
      {typeof maxLength === 'number' && <div className={styles.counter}>{currentLength}/{maxLength}</div>}
    </div>
  );
}
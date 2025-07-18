// src/components/FloatingLabelInput/FloatingLabelInput.tsx
'use client';

import React, { InputHTMLAttributes, useState } from 'react';
import styles from './FloatingLabelInput.module.css';
import { Eye, EyeOff } from 'lucide-react';

interface FloatingLabelInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** se true, não mostra o ícone de olho interno */
  hideToggle?: boolean;
}

export default function FloatingLabelInput({
  label,
  id,
  type = 'text',
  value,
  onChange,
  hideToggle = false,
  ...rest
}: FloatingLabelInputProps) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const hasValue = !!(value as string)?.toString().length;
  const isPassword = type === 'password';
  const showToggle = isPassword && !hideToggle;
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`${styles.container} ${focused || hasValue ? styles.filled : ''}`}>
      <input
        id={id}
        type={inputType}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder=" "
        className={styles.input}
        {...rest}
      />
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {showToggle && (
        <button
          type="button"
          className={styles.toggleButton}
          onClick={() => setShowPassword(prev => !prev)}
          tabIndex={-1}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      )}
    </div>
  );
}

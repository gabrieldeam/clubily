// src/components/FloatingLabelInput/FloatingLabelInput.tsx
'use client';

import React, { InputHTMLAttributes, useState } from 'react';
import styles from './FloatingLabelInput.module.css';
import { Eye, EyeOff } from 'lucide-react';

interface FloatingLabelInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /**
   * Controle externo de visibilidade da senha.
   * Se definido, suprime o toggle interno.
   */
  showPassword?: boolean;
}

export default function FloatingLabelInput({
  label,
  id,
  type = 'text',
  value,
  onChange,
  maxLength,
  showPassword: controlledShowPassword,
  ...rest
}: FloatingLabelInputProps) {
  const [focused, setFocused] = useState(false);
  const [localShowPassword, setLocalShowPassword] = useState<boolean>(false);

  const isPwdField = type === 'password';
  // decide se mostra texto ou password
  const actualShow = isPwdField
    ? (controlledShowPassword !== undefined
        ? controlledShowPassword
        : localShowPassword)
    : undefined;
  const inputType = isPwdField
    ? (actualShow ? 'text' : 'password')
    : type;

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

      {/* Toggle interno só quando for campo senha e não houver controle externo */}
      {isPwdField && controlledShowPassword === undefined && (
        <button
          type="button"
          className={styles.toggleButton}
          onClick={() => setLocalShowPassword(prev => !prev)}
          tabIndex={-1}
        >
          {actualShow ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      )}

      {/* contador de caracteres */}
      {typeof maxLength === 'number' && (
        <div className={styles.counter}>
          {currentLength}/{maxLength}
        </div>
      )}
    </div>
  );
}

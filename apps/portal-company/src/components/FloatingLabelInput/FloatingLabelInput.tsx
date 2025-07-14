'use client';

import React, { InputHTMLAttributes, useState } from 'react';
import styles from './FloatingLabelInput.module.css';
import { Eye, EyeOff } from 'lucide-react';

interface FloatingLabelInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

/**
 * Input com label que flutua acima quando o campo está focado ou contém valor.
 * Se receber a prop maxLength, exibe um contador de caracteres abaixo.
 * Se for type="password", exibe um ícone para alternar visibilidade.
 */
export default function FloatingLabelInput({
  label,
  id,
  type = 'text',
  value,
  onChange,
  maxLength,
  ...rest
}: FloatingLabelInputProps) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const hasValue = !!(value as string)?.toString().length;
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const currentLength = (value as string)?.toString().length || 0;

  return (
    <div className={styles.container + ' ' + (focused || hasValue ? styles.filled : '')}>
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
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>

      {isPassword && (
        <button
          type="button"
          className={styles.toggleButton}
          onClick={() => setShowPassword(prev => !prev)}
          tabIndex={-1}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      )}

      {typeof maxLength === 'number' && (
        <div className={styles.counter}>
          {currentLength}/{maxLength}
        </div>
      )}
    </div>
  );
}

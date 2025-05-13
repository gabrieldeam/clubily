'use client';

import React, { InputHTMLAttributes, useState } from 'react';
import styles from './FloatingLabelInput.module.css';

interface FloatingLabelInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

/**
 * Input com label que flutua acima quando o campo está focado ou contém valor.
 */
export default function FloatingLabelInput({
  label,
  id,
  value,
  onChange,
  ...rest
}: FloatingLabelInputProps) {
  const [focused, setFocused] = useState(false);

  const hasValue = !!(value as string)?.toString().length;

  return (
    <div
      className={`
        ${styles.container}
        ${focused || hasValue ? styles.filled : ''}
      `}
    >
      <input
        id={id}
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
    </div>
  );
}

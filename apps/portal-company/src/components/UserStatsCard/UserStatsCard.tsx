// src/components/UserStatsCard/UserStatsCard.tsx
'use client';

import React from 'react';
import styles from './UserStatsCard.module.css';

interface UserStatsCardProps {
  title: string;
  validCount: number;
  totalCashback: number;
}

export default function UserStatsCard({ title, validCount, totalCashback }: UserStatsCardProps) {
  return (
    <div className={styles.card}>
      <h5 className={styles.title}>{title}</h5>
      <p>
        <strong>Usos válidos:</strong> {validCount}
      </p>
      <p>
        <strong>Total cashback:</strong> R$ {totalCashback.toFixed(2)}
      </p>
    </div>
  );
}

// /app/registros/page.tsx
'use client';

import Header from '@/components/Header/Header';
import BranchesMain from '@/components/BranchesMain/BranchesMain';
import styles from './page.module.css';

export default function RegistrosPage() {
  return (
    <>
      <Header />

      <div className={styles.container}>
        <BranchesMain />
      </div>
    </>
  );
}

// src/components/AdminHeader/AdminHeader.tsx
'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import styles from './AdminHeader.module.css';

export default function AdminHeader() {
  const router = useRouter();

  const handleLogout = async () => {
    // exemplo de logout: limpar token/contexto e redirecionar
    // AuthContext pode ter um método logout
    // await auth.logout();
    router.push('/');
  };

  return (
    <header className={styles.header}>
      <div className={styles.brand}>Admin Panel</div>
      <button
        className={styles.logoutBtn}
        onClick={handleLogout}
        aria-label="Sair do admin"
      >
        <LogOut size={20} />
        <span>Sair do admin</span>
      </button>
    </header>
  );
}
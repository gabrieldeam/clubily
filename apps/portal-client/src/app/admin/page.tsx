'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function AdminPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  // Se já carregou e não é admin, redireciona pra home
  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace('/');
    }
  }, [loading, isAdmin, router]);

  if (loading) {
    return <p className={styles.loading}>Carregando...</p>;
  }

  if (!isAdmin) {
    // enquanto faz o replace não renderiza nada
    return null;
  }

 const goToCategories = async () => {
  await router.push('/admin/categories');
};

  return (
    <div className={styles.container}>        
        <h1>Painel de Administração</h1>
        <p>Bem‐vindo, <strong>{user?.name}</strong>! Aqui você pode gerenciar o sistema.</p>
      
      <main className={styles.main}>
        <div className={styles.gridItem} onClick={() => goToCategories()}>    
              <Image src="/icons/categoria.svg" alt="Editar perfil" width={40} height={40} />
              <span>Categorias</span>   
        </div>
        <div className={styles.gridItem}>
        </div>
      </main>
    </div>
  );
}

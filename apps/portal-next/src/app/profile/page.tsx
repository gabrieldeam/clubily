// app/profile/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header/Header';
import CustomMapLeaflet from '@/components/CustomMapLeaflet';
import styles from './page.module.css';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [loading, user, router]);

  if (loading) {
    return <div className={styles.container}>Carregando perfil...</div>;
  }
  if (!user) {
    return null;
  }

  // endereço completo para o pin personalizado
  const fullAddress = `${user.street}, ${user.postal_code}, ${user.city}, ${user.state}`;

  return (
    <div className={styles.container}>
      <Header onSearch={q => console.log('Pesquisar por:', q)} />

      <main className={styles.gridContainer}>
        {/* 1º card: Nome, Description + CustomMap */}
        <div className={styles.gridItem}>
          <p><strong>Nome:</strong> {user.name}</p>
          <p><strong>Description:</strong> {user.description}</p>
          <div className={styles.mapContainer}>
            <CustomMapLeaflet
              address={fullAddress}
              iconUrl="/custom-pin.svg"
            />
          </div>
        </div>


        {/* 2º card: dividido em 2 linhas */}
        <div className={styles.subGrid}>
          <div className={styles.gridItem}>
            <p className={styles.userName}>{user.name}</p>
          </div>
          <div className={styles.gridItem}>
            <p><strong>E-mail:</strong> {user.email}</p>
            <p><strong>Telefone:</strong> {user.phone || '–'}</p>
            <p><strong>CNPJ:</strong> {user.cnpj}</p>
          </div>
        </div>

        {/* 3º card: vazio por enquanto */}
        <div className={styles.gridItem}></div>

        {/* 4º card: preparado para 2 linhas */}
        <div className={styles.subGrid}>
          <div className={styles.gridItem}>{/* linha 1: preencher depois */}</div>
          <div className={styles.gridItem}>{/* linha 2: preencher depois */}</div>
        </div>
      </main>
    </div>
  );
}

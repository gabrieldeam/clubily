// app/profile/page.tsx
'use client';

import { useEffect, useState, useMemo  } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header/Header';
import Modal from '@/components/Modal/Modal';
import EditUserForm from '@/components/EditUserForm/EditUserForm';
import styles from './page.module.css';

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [openEdit, setOpenEdit] = useState(false);
  const { refreshUser } = useAuth();

   const displayName = useMemo(() => {
    const name = user?.name ?? '';
    const MAX = 30;
    return name.length > MAX ? name.slice(0, MAX) + '...' : name;
  }, [user?.name]);


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

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };


  return (
    <div className={styles.container}>
      <Header onSearch={(q) => console.log('Pesquisar por:', q)} />

      <main className={styles.gridContainer}>

        {/* 1º card: perfil */}
        <div className={styles.gridItem}>
          <div className={styles.profileHeader}>
            <p className={styles.userName}  style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>{displayName}</p>
            <div className={styles.editIcon} onClick={() => setOpenEdit(true)}>
              <Image src="/edit.svg" alt="Editar perfil" width={24} height={24} />
            </div>
          </div>
          
        </div>

        {/* 2º card: dividido em 2 linhas */}
          <div className={styles.gridItem}>
            <div className={styles.item}>
              <p>Telefone</p>
              <span>{user.phone}</span>
            </div>
            <div className={styles.item}>
              <p>E-mail</p>
              <span>{user.email}</span>
            </div>
          </div>

        {/* 3º card: links */}
        <div className={styles.gridItem}>
          <Link href="/">
            <div className={styles.itemLink}>
              <p>Sobre nós</p>
              <Image src="/seta.svg" alt="Logo" width={22} height={22} />
            </div>
          </Link>
          <Link href="/">
            <div className={styles.itemLink}>
              <p>Política de privacidade</p>
              <Image src="/seta.svg" alt="Logo" width={22} height={22} />
            </div>
          </Link>
          <Link href="/">
            <div className={styles.itemLink}>
              <p>Termo de uso</p>
              <Image src="/seta.svg" alt="Logo" width={22} height={22} />
            </div>
          </Link>
        </div>

        {/* 4º card: ajuda + sair/deletar */}
        <div className={styles.subGrid}>
          <div className={styles.gridItem}>
            <div className={styles.item}>
              <p>Ajuda</p>
              <div className={styles.gridDivHelp}>
                <button type="button" className={styles.buttomHelp}>Chat</button>
                <button type="button" className={styles.buttomHelp}>E-mail</button>
              </div>
            </div>
          </div>
          <div className={styles.gridDiv}>
            <div className={styles.gridItem}>
              <div className={styles.itemDelete}>
                <p>Deletar conta</p>
                <Image src="/redSeta.svg" alt="Logo" width={22} height={22} />
              </div>
            </div>
            <div className={styles.gridItem}>
              <div className={styles.itemLink} onClick={handleLogout}>
                <p>Sair</p>
                <Image src="/seta.svg" alt="Logo" width={22} height={22} />
              </div>
            </div>
          </div>
        </div>

      </main>

      <Modal open={openEdit} onClose={() => setOpenEdit(false)}>
        <EditUserForm
          onClose={() => setOpenEdit(false)}
          onSaved={() => {
            refreshUser();
            setOpenEdit(false);
          }}
        />
      </Modal>
    </div>
  );
}

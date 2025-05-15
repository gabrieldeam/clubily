// app/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header/Header';
import Modal from '@/components/Modal/Modal';
import EditCompanyForm from '@/components/EditCompanyForm/EditCompanyForm';
import CustomMapLeaflet from '@/components/CustomMapLeaflet';
import styles from './page.module.css';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [openEdit, setOpenEdit] = useState(false);
  const { refreshUser } = useAuth();

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

  const fullAddress = `${user.street}, ${user.postal_code}, ${user.city}, ${user.state}`;

  return (
    <div className={styles.container}>
      <Header onSearch={(q) => console.log('Pesquisar por:', q)} />

      <main className={styles.gridContainer}>

        {/* 1º card: perfil */}
        <div className={styles.gridItem}>
          <div className={styles.profileHeader}>
            <div className={styles.leftSection}>
              <div className={styles.avatarWrapper}>
                {user.logo_url?.trim() ? (
                  <Image
                    src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${user.logo_url}`}
                    alt={`${user.name} logo`}
                    width={92}
                    height={92}
                    className={styles.avatarCircle}
                  />
                ) : (
                  <div className={styles.avatarCircle}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                {/* Categoria ou botão de adicionar */}
                {user.categories?.[0]?.image_url?.trim() ? (
                  <Image
                    src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${user.categories[0].image_url}`}
                    alt="Categoria"
                    width={32}
                    height={32}
                    className={styles.addCircle}
                  />
                ) : (
                  <div className={styles.addCircle}>+</div>
                )}
              </div>
              <div className={styles.userInfo}>
                <p className={styles.userNameLarge}>{user.name}</p>
                <p className={styles.userDesc}>
                  {user.description?.trim()
                    ? user.description
                    : 'Clique no botão editar para poder criar uma descrição legal para o seu negócio'}
                </p>
              </div>
            </div>
            <div className={styles.editIcon} onClick={() => setOpenEdit(true)}>
              <Image src="/edit.svg" alt="Editar perfil" width={24} height={24} />
            </div>
          </div>
          <div className={styles.mapContainer}>
            <CustomMapLeaflet address={fullAddress} iconUrl="/custom-pin.svg" />
          </div>
        </div>

        {/* 2º card: dividido em 2 linhas */}
        <div className={styles.subGrid}>
          <div className={styles.gridItem}>
            <div className={styles.item}>
              <p className={styles.userName}>{user.name}</p>
              <p className={
                user.is_active
                  ? styles.statusActive
                  : styles.statusDesactive
              }>
                {user.is_active ? 'Ativo' : 'Desativado'}
              </p>
            </div>
          </div>
          <div className={styles.gridItem}>
            <div className={styles.item}>
              <p>Telefone</p>
              <span>{user.phone}</span>
            </div>
            <div className={styles.item}>
              <p>CNPJ</p>
              <span>{user.cnpj}</span>
            </div>
            <div className={styles.item}>
              <p>E-mail</p>
              <span>{user.email}</span>
            </div>
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
              <div className={styles.gridDiv}>
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
              <div className={styles.itemLink}>
                <p>Sair</p>
                <Image src="/seta.svg" alt="Logo" width={22} height={22} />
              </div>
            </div>
          </div>
        </div>

      </main>

      <Modal open={openEdit} onClose={() => setOpenEdit(false)}>
        <EditCompanyForm
          companyId={user.id}
          onClose={() => setOpenEdit(false)}
          onSaved={refreshUser}
        />
      </Modal>
    </div>
  );
}

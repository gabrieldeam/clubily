'use client';

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header/Header';
import Modal from '@/components/Modal/Modal';
import EditCompanyForm from '@/components/EditCompanyForm/EditCompanyForm';
import SimpleEditCompanyForm from '@/components/EditCompanyForm/SimpleEditCompanyForm';
import CustomMapLeaflet from '@/components/CustomMapLeaflet';
import styles from './page.module.css';

export default function ProfilePage() {
  const { user, loading, logout, refreshUser } = useAuth();
  const router = useRouter();

  // controle das duas modais
  const [openAutoEdit, setOpenAutoEdit] = useState(false);
  const [openManualEdit, setOpenManualEdit] = useState(false);

  const displayName = useMemo(() => {
    const name = user?.name ?? '';
    const MAX = 30;
    return name.length > MAX ? name.slice(0, MAX) + '...' : name;
  }, [user?.name]);

  // redireciona se não logado
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [loading, user, router]);

  // dispara SimpleEditCompanyForm se faltar qualquer campo essencial
  useEffect(() => {
    if (!loading && user) {
      const needsDescription = !(user.description?.trim());
      const needsLogo = !user.logo_url?.trim();
      const needsCategory = !(user.categories?.length);
      if (needsDescription || needsLogo || needsCategory) {
        setOpenAutoEdit(true);
      }
    }
  }, [loading, user]);

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

  const fullAddress = `${user.street}, ${user.postal_code}, ${user.city}, ${user.state}`;

  return (
    <div className={styles.container}>
      <Header onSearch={q => console.log('Pesquisar por:', q)} />

      <main className={styles.gridContainer}>
        {/* 1º card: perfil */}
        <div className={styles.gridItem}>
          <div className={styles.profileHeader}>
            <div className={styles.leftSection}>
              <div className={styles.avatarWrapper}>
                {user.logo_url?.trim() ? (
                  <Image
                    src={`${process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL}${user.logo_url}`}
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
                {user.categories?.[0]?.image_url?.trim() ? (
                  <Image
                    src={`${process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL}${user.categories[0].image_url}`}
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
                  {user.description?.trim() ||
                    'Clique no botão editar para criar uma descrição para seu negócio.'}
                </p>
              </div>
            </div>
            {/* Ícone abre modal manual */}
            <div
              className={styles.editIcon}
              onClick={() => setOpenManualEdit(true)}
            >
              <Image
                src="/edit.svg"
                alt="Editar perfil"
                width={24}
                height={24}
              />
            </div>
          </div>
          <div className={styles.mapContainer}>
            <CustomMapLeaflet
              address={fullAddress}
              iconUrl="/custom-pin.svg"
            />
          </div>
        </div>

        {/* 2º card: status e dados */}
        <div className={styles.subGrid}>
          <div className={styles.gridItem}>
            <div className={styles.item}>
              <p
                className={styles.userName}
                style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
              >
                {displayName}
              </p>
              <p
                className={
                  user.is_active
                    ? styles.statusActive
                    : styles.statusDesactive
                }
              >
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
              <div className={styles.gridDivHelp}>
                <button type="button" className={styles.buttomHelp}>
                  Chat
                </button>
                <button type="button" className={styles.buttomHelp}>
                  E-mail
                </button>
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
              <div
                className={styles.itemLink}
                onClick={handleLogout}
                style={{ cursor: 'pointer' }}
              >
                <p>Sair</p>
                <Image src="/seta.svg" alt="Logo" width={22} height={22} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de edição completa */}
      <Modal
        open={openManualEdit}
        onClose={() => setOpenManualEdit(false)}
      >
        <EditCompanyForm
          companyId={user.id}
          onClose={() => setOpenManualEdit(false)}
          onSaved={() => {
            refreshUser();
            setOpenManualEdit(false);
          }}
        />
      </Modal>

      {/* Modal simplificada dispara só quando faltar dados */}
      <Modal open={openAutoEdit} onClose={() => setOpenAutoEdit(false)}>
        <SimpleEditCompanyForm
          companyId={user.id}
          onClose={() => setOpenAutoEdit(false)}
          onSaved={() => {
            refreshUser();
            setOpenAutoEdit(false);
          }}
        />
      </Modal>
    </div>
  );
}

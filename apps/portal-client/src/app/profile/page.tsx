// src/app/profile/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { listAddresses, deleteAddress } from '@/services/addressService';
import { getMyCompanies } from '@/services/userService';
import type { AddressRead } from '@/types/address';
import type { CompanyRead } from '@/types/company';
import Header from '@/components/Header/Header';
import Modal from '@/components/Modal/Modal';
import EditUserForm from '@/components/EditUserForm/EditUserForm';
import styles from './page.module.css';

export default function ProfilePage() {
  const { user, loading, logout, refreshUser } = useAuth();
  const router = useRouter();

  const [openEdit, setOpenEdit] = useState(false);

  // endereços
  const [addresses, setAddresses] = useState<AddressRead[]>([]);
  const [loadingAddr, setLoadingAddr] = useState(true);

  // empresas do usuário
  const [page, setPage] = useState(1);
  const [companies, setCompanies] = useState<CompanyRead[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingComp, setLoadingComp] = useState(true);

  const displayName = useMemo(() => {
    const name = user?.name ?? '';
    const MAX = 30;
    return name.length > MAX ? name.slice(0, MAX) + '...' : name;
  }, [user?.name]);

  // redirect se não autenticado
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [loading, user, router]);

  useEffect(() => {
    getMyCompanies(page, 10).then(res => {
      setCompanies(res.data);
    });
  }, [page]);

  // carrega endereços
  useEffect(() => {
    listAddresses()
      .then(res => setAddresses(res.data))
      .finally(() => setLoadingAddr(false));
  }, []);

  // carrega empresas do usuário
  useEffect(() => {
    getMyCompanies()
      .then(res => setCompanies(res.data))
      .finally(() => setLoadingComp(false));
  }, []);

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

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este endereço?')) return;
    try {
      await deleteAddress(id);
      setAddresses(prev => prev.filter(a => a.id !== id));
    } catch {
      alert('Falha ao excluir endereço.');
    }
  };

  return (
    <div className={styles.container}>
      <Header onSearch={q => router.push(`/search?name=${encodeURIComponent(q)}`)} />

      <main className={styles.gridContainer}>

        {/* 1º card: perfil */}
        <div className={styles.gridItem}>
          <div className={styles.profileHeader}>
            <p className={styles.userName} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {displayName}
            </p>
            <div className={styles.editIcon} onClick={() => setOpenEdit(true)}>
              <Image src="/edit.svg" alt="Editar perfil" width={24} height={24} />
            </div>
          </div>
        </div>

        {/* 2º card: contato */}
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

        {/* 4º card: ajuda + sair */}
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

      {/* Endereços */}
      <div className={styles.gridItem}>
        <h4>Endereços</h4>
        {loadingAddr ? (
          <p>Carregando endereços…</p>
        ) : addresses.length === 0 ? (
          <p>Nenhum endereço cadastrado.</p>
        ) : (
          <ul className={styles.addressList}>
            {addresses.map(addr => (
              <li key={addr.id} className={styles.addressItem}>
                <div className={styles.addressInfo}>
                  {addr.street}, {addr.city} – {addr.state}
                </div>
                <button
                  className={styles.button}
                  onClick={() => handleDelete(addr.id)}
                >
                  Excluir
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Minhas Empresas */}
      <div className={styles.gridSubItem}>
        <h4>Empresas que tem o seu cadastro</h4>
        {loadingComp ? (
          <p>Carregando empresas…</p>
        ) : companies.length === 0 ? (
          <p>Nenhuma empresa associada.</p>
        ) : (
          <ul className={styles.list}>
            {companies.map(c => (
              <li key={c.id}>
                <Link href={`/companies/${c.id}`} className={styles.itemcompanies}>
                  <div className={styles.companyInfo}>
                    {c.logo_url && (
                      <Image
                        src={`${process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL}${c.logo_url}`}
                        alt={c.name}
                        width={60}
                        height={60}
                        className={styles.logo}
                      />
                    )}
                    <div>
                      <h2 className={styles.name}>{c.name}</h2>
                      {c.description && <p className={styles.desc}>{c.description}</p>}
                    </div>
                  </div>
                  <span className={styles.tag}>                    
                    Ver empresa
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className={styles.pagination}>
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            Anterior
          </button>
          <span>Página {page}</span>
          <button disabled={!hasMore} onClick={() => setPage(p => p + 1)}>
            Próxima
          </button>
        </div>
      </div>

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

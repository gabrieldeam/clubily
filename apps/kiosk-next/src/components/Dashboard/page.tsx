// src/app/clients/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Modal from '@/components/Modal/Modal';
import ClientModal from '@/components/ClientModal/ClientModal';
import { listCompanyClients } from '@/services/companyService';
import type { UserRead } from '@/types/user';
import styles from './page.module.css';

export default function ClientsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // paginação
  const LIMIT = 10;
  const [page, setPage] = useState(0);
  const [clients, setClients] = useState<UserRead[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<UserRead | null>(null);

  // protege rota
  useEffect(() => {
    if (!loading && !user) router.replace('/');
  }, [loading, user, router]);

  // fetch toda vez que mudar de página
  useEffect(() => {
    if (!user) return;
    setLoadingClients(true);
    listCompanyClients(page * LIMIT, LIMIT)
      .then(res => setClients(res.data))
      .catch(console.error)
      .finally(() => setLoadingClients(false));
  }, [user, page]);

  if (loading) return <div className={styles.container}>Carregando perfil...</div>;
  if (!user) return null;

  const openAddModal = () => {
    setSelectedClient(null);
    setOpenModal(true);
  };

  const openEditModal = (c: UserRead) => {
    if (c.pre_registered) {
      setSelectedClient(c);
      setOpenModal(true);
    }
  };

  return (
    <div className={styles.container}>

      <main className={styles.main}>
          <button className={styles.addBtn} onClick={openAddModal}>
            Adicionar Cliente
          </button>
      </main>

      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <ClientModal onClose={() => setOpenModal(false)} />
      </Modal>
    </div>
  );
}
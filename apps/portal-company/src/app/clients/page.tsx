// src/app/clients/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header/Header';
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
      <Header onSearch={() => {}} />

      <main className={styles.main}>
        <div className={styles.headerRow}>
          <h2>Meus Clientes</h2>
          <button className={styles.addBtn} onClick={openAddModal}>
            Adicionar Cliente
          </button>
        </div>

        {loadingClients ? (
          <p>Carregando clientes...</p>
        ) : clients.length > 0 ? (
          <>
            <div className={styles.tableWrapper}>
              <div className={styles.rowHeader}>
                <div className={styles.cellName}>Nome</div>
                <div className={styles.cellEmail}>Email</div>
                <div className={styles.cellPhone}>Telefone</div>
              </div>
              <div className={styles.body}>
                {clients.map(c => (
                  <div
                    key={c.id}
                    className={`${styles.row} ${
                      c.pre_registered ? styles.masked : ''
                    }`}
                    onClick={() =>
                      c.pre_registered ? openEditModal(c) : undefined
                    }
                    title={
                      c.pre_registered
                        ? 'Esse usuário não tem cadastro completo'
                        : undefined
                    }
                  >
                    <div className={styles.cellName}>
                      {c.pre_registered ? '*****' : c.name}
                    </div>
                    <div className={styles.cellEmail}>
                      {c.pre_registered ? '*****' : c.email}
                    </div>
                    <div className={styles.cellPhone}>{c.phone}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Controles de página */}
            <div className={styles.pagination}>
              <button
                onClick={() => setPage(p => Math.max(p - 1, 0))}
                disabled={page === 0}
              >
                Anterior
              </button>
              <span>Página {page + 1}</span>
              <button
                onClick={() => clients.length === LIMIT ? setPage(p => p + 1) : null}
                disabled={clients.length < LIMIT}
              >
                Próxima
              </button>
            </div>
          </>
        ) : (
          <p>Nenhum cliente encontrado na página atual.</p>
        )}
      </main>

      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <ClientModal onClose={() => setOpenModal(false)} />
      </Modal>
    </div>
  );
}
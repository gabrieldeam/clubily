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

  // modais
  const [openModal, setOpenModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<UserRead | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // modo de visualização: 'list' ou 'card'
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');

  // detecta mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // em mobile, força card
  useEffect(() => {
    if (isMobile) setViewMode('card');
  }, [isMobile]);

  // protege rota
  useEffect(() => {
    if (!loading && !user) router.replace('/');
  }, [loading, user, router]);

  // busca clientes
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

  const openClientModal = (client: UserRead) => {
    setSelectedClient(client);
    setOpenModal(true);
  };

  // formatadores
  const formatPhoneDisplay = (c: UserRead) =>
    c.phone && c.phone.trim() !== '' ? c.phone : '*****';

  const formatCpfDisplay = (c: UserRead) => {
    if (!c.cpf || c.cpf.trim() === '') return '*****';
    if (!c.phone || c.phone.trim() === '') return c.cpf;
    const cpfLast4 = c.cpf.slice(-4);
    const phoneLast4 = c.phone.slice(-4);
    return cpfLast4 === phoneLast4 ? '*****' : c.cpf;
  };

  return (
    <div className={styles.container}>
      <Header />

      <main className={styles.main}>
        <div className={styles.headerRow}>
          <h2>Meus Clientes</h2>
          <div className={styles.actionsHeader}>
            {!isMobile && (
              <button
                className={styles.viewToggleBtn}
                onClick={() => setViewModalOpen(true)}
              >
                Mudar Visualização
              </button>
            )}
            <button className={styles.addBtn} onClick={openAddModal}>
              Adicionar Cliente
            </button>
          </div>
        </div>

        {loadingClients ? (
          <p className={styles.loading}>Carregando clientes...</p>
        ) : clients.length > 0 ? (
          <>
            {viewMode === 'list' ? (
              <div className={styles.tableWrapper}>
                <div className={styles.rowHeader}>
                  <div className={styles.cellName}>Nome</div>
                  <div className={styles.cellEmail}>Email</div>
                  <div className={styles.cellPhone}>Telefone</div>
                  <div className={styles.cellPhone}>CPF</div>
                </div>
                <div className={styles.body}>
                  {clients.map(c => (
                    <div
                      key={c.id}
                      className={`${styles.row} ${c.pre_registered ? styles.masked : ''}`}
                      onClick={() => openClientModal(c)}
                      title={c.pre_registered ? 'Usuário pré-cadastrado' : undefined}
                    >
                      <div className={styles.cellName} data-label="Nome:">
                        {c.pre_registered ? '*****' : c.name}
                      </div>
                      <div className={styles.cellEmail} data-label="Email:">
                        {c.pre_registered ? '*****' : c.email}
                      </div>
                      <div className={styles.cellPhone} data-label="Telefone:">
                        {formatPhoneDisplay(c)}
                      </div>
                      <div className={styles.cellPhone} data-label="CPF:">
                        {formatCpfDisplay(c)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.cardGrid}>
                {clients.map(c => (
                  <div
                    key={c.id}
                    className={styles.card}
                    onClick={() => openClientModal(c)}
                  >
                    <div className={styles.cardHeader}>
                      <h3>{c.pre_registered ? '*****' : c.name}</h3>
                      {c.pre_registered && (
                        <span className={styles.cardBadge}>Pré-cadastrado</span>
                      )}
                    </div>
                    <p className={styles.cardSubtitle}>
                      {c.pre_registered ? '*****' : c.email}
                    </p>
                    <div className={styles.cardDetails}>
                      <p>
                        <strong>Telefone:</strong> {formatPhoneDisplay(c)}
                      </p>
                      <p>
                        <strong>CPF:</strong> {formatCpfDisplay(c)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.pagination}>
              <button
                onClick={() => setPage(p => Math.max(p - 1, 0))}
                disabled={page === 0}
              >
                Anterior
              </button>
              <span>Página {page + 1}</span>
              <button
                onClick={() =>
                  clients.length === LIMIT ? setPage(p => p + 1) : undefined
                }
                disabled={clients.length < LIMIT}
              >
                Próxima
              </button>
            </div>
          </>
        ) : (
          <p className={styles.loading}>
            Nenhum cliente encontrado na página atual.
          </p>
        )}
      </main>

      {/* Modal de detalhes / edição */}
      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        {selectedClient ? (
          <div className={styles.modalContent}>
            <h2 className={styles.title}>Dados do Cliente</h2>
            <div className={styles.userInfo}>
              <p>
                <strong>Nome:</strong>{' '}
                {selectedClient.pre_registered ? '*****' : selectedClient.name}
              </p>
              <p>
                <strong>E-mail:</strong>{' '}
                {selectedClient.pre_registered ? '*****' : selectedClient.email}
              </p>
              <p>
                <strong>Telefone:</strong> {formatPhoneDisplay(selectedClient)}
              </p>
              <p>
                <strong>CPF:</strong> {formatCpfDisplay(selectedClient)}
              </p>
            </div>
          </div>
        ) : (
          <ClientModal onClose={() => setOpenModal(false)} />
        )}
      </Modal>

      {/* Modal de escolha de visualização */}
      <Modal open={viewModalOpen} onClose={() => setViewModalOpen(false)}>
        <div className={styles.viewModeModal}>
          <h2>Escolha o modo de visualização</h2>
          <div className={styles.viewOptions}>
            <button
              onClick={() => {
                setViewMode('list');
                setViewModalOpen(false);
              }}
            >
              📄 Lista
            </button>
            <button
              onClick={() => {
                setViewMode('card');
                setViewModalOpen(false);
              }}
            >
              🧾 Card
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

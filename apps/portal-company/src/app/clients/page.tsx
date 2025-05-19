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
  const [clients, setClients] = useState<UserRead[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      listCompanyClients()
        .then(res => setClients(res.data))
        .catch(console.error)
        .finally(() => setLoadingClients(false));
    }
  }, [user]);

  if (loading) return <div className={styles.container}>Carregando perfil...</div>;
  if (!user) return null;

  return (
    <div>
      <Header onSearch={() => {}} />
      <main className={styles.main}>
        <div className={styles.itemTitle}>
            <h1>Meus Clientes</h1>
            <button
            className={styles.addBtn}
            onClick={() => setOpenModal(true)}
            >
            Adicionar Cliente
            </button>
        </div>

        {loadingClients ? (
          <p>Carregando clientes...</p>
        ) : clients.length ? (
          <ul className={styles.list}>
            {clients.map(c => (
              <li key={c.id} className={styles.item}>
                <strong>{c.name}</strong> — {c.email}
              </li>
            ))}
          </ul>
        ) : (
          <p>Nenhum cliente encontrado.</p>
        )}        
      </main>

      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <ClientModal onClose={() => setOpenModal(false)} />
      </Modal>
    </div>
  );
}
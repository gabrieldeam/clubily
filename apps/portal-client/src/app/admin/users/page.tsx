// src/app/admin/users/page.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { listUsers } from '@/services/userService';
import type { UserRead, PaginatedUsers } from '@/types/user';
import Modal from '@/components/Modal/Modal';
import Notification from '@/components/Notification/Notification';
import { User as UserIcon } from 'lucide-react';
import styles from './page.module.css';

type ViewMode = 'table' | 'cards';
type NotificationState = { type: 'success' | 'error'; message: string };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [total, setTotal] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRead | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [notification, setNotification] = useState<NotificationState | null>(null);

  // Memoized fetchUsers
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      const res = await listUsers(skip, limit);
      const data: PaginatedUsers = res.data;
      setUsers(data.items);
      setTotal(data.total);
    } catch (error: unknown) {
      const message = error instanceof Error
        ? error.message
        : 'Erro ao buscar usuários';
      setNotification({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function openDetails(user: UserRead) {
    setSelectedUser(user);
    setModalOpen(true);
  }
  function closeDetails() {
    setModalOpen(false);
    setSelectedUser(null);
  }

  const lastPage = Math.ceil(total / limit);

  if (loading) {
    return <p>Carregando usuários...</p>;
  }

  return (
    <div className={styles.container}>
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
      <header className={styles.header}>
        <h1>Usuários</h1>
        <div className={styles.viewToggle}>
          <button
            className={viewMode === 'table' ? styles.activeToggle : ''}
            onClick={() => setViewMode('table')}
          >
            Tabela
          </button>
          <button
            className={viewMode === 'cards' ? styles.activeToggle : ''}
            onClick={() => setViewMode('cards')}
          >
            Cards
          </button>
        </div>
      </header>

      {viewMode === 'table' ? (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Role</th>
                <th>Pré-cadastrado?</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td data-label="Nome">{user.name}</td>
                  <td data-label="Email">{user.email}</td>
                  <td data-label="Role">{user.role}</td>
                  <td data-label="Pré-cadastrado?">{user.pre_registered ? 'Sim' : 'Não'}</td>
                  <td data-label="Ações" className={styles.actions}>
                    <button
                      className={styles.btnDetail}
                      onClick={() => openDetails(user)}
                    >
                      Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.cardsGrid}>
          {users.map(user => (
            <div key={user.id} className={styles.card}>
              <UserIcon size={40} className={styles.cardIcon} />
              <div className={styles.cardBody}>
                <h2>{user.name}</h2>
                <p>{user.email}</p>
                <span className={styles.badgeRole}>{user.role}</span>
              </div>
              <button
                className={styles.btnDetail}
                onClick={() => openDetails(user)}
              >
                Detalhes
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={styles.pagination}>
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          ← Anterior
        </button>
        <span>
          {page} / {lastPage}
        </span>
        <button
          onClick={() => setPage(p => Math.min(lastPage, p + 1))}
          disabled={page === lastPage}
        >
          Próxima →
        </button>
      </div>

      <Modal open={modalOpen} onClose={closeDetails} width={600}>
        {selectedUser && (
          <div className={`${styles.detail} ${styles.detailGrid}`}>
            <div className={styles.detailLeft}>
              <h2>{selectedUser.name}</h2>
              <section>
                <h3>Contato</h3>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                {selectedUser.phone && (
                  <p><strong>Telefone:</strong> {selectedUser.phone}</p>
                )}
                <p><strong>ID:</strong> {selectedUser.id}</p>
              </section>
              <section>
                <h3>CPF</h3>
                <p>{selectedUser.cpf}</p>
              </section>
            </div>
            <div className={styles.detailRight}>
              <section>
                <h3>Role</h3>
                <p>{selectedUser.role}</p>
              </section>
              <section>
                <h3>Pré-cadastrado</h3>
                <p>{selectedUser.pre_registered ? 'Sim' : 'Não'}</p>
              </section>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

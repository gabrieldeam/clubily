// src/app/admin/commissions/page.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  listWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
} from '@/services/commissionAdminService';
import type { CommissionWithdrawalRead } from '@/types/commissionAdmin';
import Notification from '@/components/Notification/Notification';
import Modal from '@/components/Modal/Modal';
import styles from './page.module.css';

export default function AdminCommissionsPage() {
  const [withdrawals, setWithdrawals] = useState<CommissionWithdrawalRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<CommissionWithdrawalRead | null>(null);

  // Memoiza fetchWithdrawals
  const fetchWithdrawals = useCallback(async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      const res = await listWithdrawals(skip, limit);
      setWithdrawals(res.data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar saques';
      setNotification({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  async function handleApprove(id: string) {
    try {
      await approveWithdrawal(id);
      setNotification({ type: 'success', message: 'Saque aprovado com sucesso!' });
      fetchWithdrawals();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao aprovar saque';
      setNotification({ type: 'error', message });
    }
  }

  async function handleReject(id: string) {
    try {
      await rejectWithdrawal(id);
      setNotification({ type: 'success', message: 'Saque rejeitado com sucesso!' });
      fetchWithdrawals();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao rejeitar saque';
      setNotification({ type: 'error', message });
    }
  }

  function openDetails(withdrawal: CommissionWithdrawalRead) {
    setSelectedWithdrawal(withdrawal);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setSelectedWithdrawal(null);
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
        <h1>Saques de Comissão</h1>
      </header>

      {loading ? (
        <p>Carregando saques...</p>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Valor</th>
                <th>Método</th>
                <th>Status</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map(w => (
                <tr key={w.id}>
                  <td data-label="Usuário">{w.user.name}</td>
                  <td data-label="Valor">R$ {w.amount.toFixed(2)}</td>
                  <td data-label="Método">
                    {w.transfer_method
                      ? `${w.transfer_method.key_type}: ${w.transfer_method.key_value}`
                      : '—'}
                  </td>
                  <td data-label="Status">
                    <span
                      className={
                        w.status === 'approved'
                          ? styles.badgeSuccess
                          : w.status === 'rejected'
                          ? styles.badgeError
                          : styles.badgePending
                      }
                    >
                      {w.status}
                    </span>
                  </td>
                  <td data-label="Data">{new Date(w.created_at).toLocaleDateString()}</td>
                  <td data-label="Ações" className={styles.actions}>
                    <button
                      className={styles.btnApprove}
                      onClick={() => handleApprove(w.id)}
                      disabled={w.status !== 'pending'}
                    >
                      Aprovar
                    </button>
                    <button
                      className={styles.btnReject}
                      onClick={() => handleReject(w.id)}
                      disabled={w.status !== 'pending'}
                    >
                      Rejeitar
                    </button>
                    <button
                      className={styles.btnDetails}
                      onClick={() => openDetails(w)}
                    >
                      Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação simples */}
      <div className={styles.pagination}>
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          ← Anterior
        </button>
        <span>{page}</span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={withdrawals.length < limit}
        >
          Próxima →
        </button>
      </div>

      {/* Modal de Detalhes */}
      <Modal open={modalOpen} onClose={closeModal} width={600}>
        {selectedWithdrawal && (
          <div className={styles.details}>
            <header className={styles.header}>
              <h2>Detalhes do Saque</h2>
            </header>

            <dl className={styles.grid}>
              <div className={styles.row}>
                <dt>ID</dt>
                <dd>{selectedWithdrawal.id}</dd>
              </div>
              <div className={styles.row}>
                <dt>Usuário</dt>
                <dd>
                  {selectedWithdrawal.user.name}
                  <br />
                  <small>({selectedWithdrawal.user.email})</small>
                </dd>
              </div>
              <div className={styles.row}>
                <dt>Valor</dt>
                <dd>R$ {selectedWithdrawal.amount.toFixed(2)}</dd>
              </div>
              <div className={styles.row}>
                <dt>Status</dt>
                <dd>
                  <span className={`${styles.badge} ${styles[selectedWithdrawal.status]}`}>
                    {selectedWithdrawal.status.charAt(0).toUpperCase() +
                      selectedWithdrawal.status.slice(1)}
                  </span>
                </dd>
              </div>
              <div className={styles.row}>
                <dt>Data</dt>
                <dd>{new Date(selectedWithdrawal.created_at).toLocaleString()}</dd>
              </div>
            </dl>

            {selectedWithdrawal.transfer_method ? (
              <>
                <h3 className={styles.subheader}>Método de Transferência</h3>
                <dl className={styles.grid}>
                  <div className={styles.row}>
                    <dt>Nome</dt>
                    <dd>{selectedWithdrawal.transfer_method.name}</dd>
                  </div>
                  <div className={styles.row}>
                    <dt>Chave</dt>
                    <dd>
                      {selectedWithdrawal.transfer_method.key_type}:<br />
                      <strong>{selectedWithdrawal.transfer_method.key_value}</strong>
                    </dd>
                  </div>
                  <div className={styles.row}>
                    <dt>Criado em</dt>
                    <dd>{new Date(selectedWithdrawal.transfer_method.created_at).toLocaleString()}</dd>
                  </div>
                </dl>
              </>
            ) : (
              <p className={styles.noMethod}>Nenhum método de transferência cadastrado.</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

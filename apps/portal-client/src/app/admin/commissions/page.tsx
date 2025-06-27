// src/app/admin/commissions/page.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  listWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
} from '@/services/commissionAdminService';
import type { CommissionWithdrawalRead } from '@/types/commissionAdmin';
import Notification from '@/components/Notification/Notification';
import styles from './page.module.css';

export default function AdminCommissionsPage() {
  const [withdrawals, setWithdrawals] = useState<CommissionWithdrawalRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchWithdrawals();
  }, [page]);

  async function fetchWithdrawals() {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      const res = await listWithdrawals(skip, limit);
      setWithdrawals(res.data);
    } catch (e: any) {
      setNotification({ type: 'error', message: e.message || 'Erro ao buscar saques' });
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    try {
      await approveWithdrawal(id);
      setNotification({ type: 'success', message: 'Saque aprovado com sucesso!' });
      fetchWithdrawals();
    } catch (e: any) {
      setNotification({ type: 'error', message: e.message || 'Erro ao aprovar saque' });
    }
  }

  async function handleReject(id: string) {
    try {
      await rejectWithdrawal(id);
      setNotification({ type: 'success', message: 'Saque rejeitado com sucesso!' });
      fetchWithdrawals();
    } catch (e: any) {
      setNotification({ type: 'error', message: e.message || 'Erro ao rejeitar saque' });
    }
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
                  <td data-label="Método">{w.transfer_method?.type ?? '—'}</td>
                  <td data-label="Status">
                    <span className={
                      w.status === 'approved' ? styles.badgeSuccess
                      : w.status === 'rejected' ? styles.badgeError
                      : styles.badgePending
                    }>
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
    </div>
  );
}

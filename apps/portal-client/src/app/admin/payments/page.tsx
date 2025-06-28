// src/app/admin/payments/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { listAdminPayments } from '@/services/paymentService';
import type { AdminCompanyPaymentRead } from '@/types/payment';
import Notification from '@/components/Notification/Notification';
import Modal from '@/components/Modal/Modal';
import { CreditCard } from 'lucide-react';
import styles from './page.module.css';

type ViewMode = 'table' | 'cards';
type NotificationState = { type: 'error' | 'success'; message: string };

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminCompanyPaymentRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const [page, setPage] = useState(1);
  const limit = 10;
  const [total, setTotal] = useState(0);

  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // estados para o intervalo de datas
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<AdminCompanyPaymentRead | null>(null);

  useEffect(() => {
    fetchPayments();
  }, [page, dateFrom, dateTo]);

  async function fetchPayments() {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      const params: Record<string, any> = { skip, limit };
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo)   params.date_to   = dateTo;
      const res = await listAdminPayments(params);
      setPayments(res.data.items);
      setTotal(res.data.total);
    } catch (e: any) {
      setNotification({ type: 'error', message: e.message || 'Erro ao buscar cobranças' });
    } finally {
      setLoading(false);
    }
  }

  function resetFilters() {
    setDateFrom('');
    setDateTo('');
    setPage(1);
  }

  function openDetails(p: AdminCompanyPaymentRead) {
    setSelectedPayment(p);
    setModalOpen(true);
  }

  function closeDetails() {
    setModalOpen(false);
    setSelectedPayment(null);
  }

  const lastPage = Math.ceil(total / limit);

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
        <h1>Pagamentos</h1>
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

      {/* FILTRO DE DATAS */}
      <div className={styles.filterBar}>
        <div>
            <label>
          De:{' '}
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            max={dateTo || undefined}
          />
        </label>
        <label>
          Até:{' '}
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            min={dateFrom || undefined}
            disabled={!dateFrom}
          />
        </label>
        </div>
        {(dateFrom || dateTo) && (
          <button
            className={styles.resetButton}
            onClick={resetFilters}
          >
            Ver tudo
          </button>
        )}
      </div>

      {loading ? (
        <p>Carregando cobranças...</p>
      ) : viewMode === 'table' ? (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Empresa</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td data-label="ID">{p.asaas_id}</td>
                  <td data-label="Empresa">{p.company.name}</td>
                  <td data-label="Valor">R$ {p.amount.toFixed(2)}</td>
                  <td data-label="Status">
                    <span
                      className={
                        p.status === 'PAID'
                          ? styles.badgePaid
                          : p.status === 'FAILED'
                          ? styles.badgeFailed
                          : p.status === 'CANCELLED'
                          ? styles.badgeCancelled
                          : styles.badgePending
                      }
                    >
                      {p.status}
                    </span>
                  </td>
                  <td data-label="Data">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                  <td data-label="Ações" className={styles.actions}>
                    <button
                      className={styles.btnDetail}
                      onClick={() => openDetails(p)}
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
          {payments.map(p => (
            <div key={p.id} className={styles.card}>
              <CreditCard size={40} className={styles.cardIcon} />
              <div className={styles.cardBody}>
                <h2>{p.company.name}</h2>
                <p>R$ {p.amount.toFixed(2)}</p>
                <span className={styles.subText}>{p.status}</span>
              </div>
              <button
                className={styles.btnDetail}
                onClick={() => openDetails(p)}
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
        {selectedPayment && (
          <div className={styles.detail}>
            <h2>Cobrança: {selectedPayment.asaas_id}</h2>
            <section>
              <h3>Empresa</h3>
              <p><strong>Nome:</strong> {selectedPayment.company.name}</p>
              <p><strong>Email:</strong> {selectedPayment.company.email}</p>
              {selectedPayment.company.phone && (
                <p><strong>Telefone:</strong> {selectedPayment.company.phone}</p>
              )}
              <p><strong>CNPJ:</strong> {selectedPayment.company.cnpj}</p>
            </section>
            <section>
              <h3>Detalhes da Cobrança</h3>
              <p><strong>Valor:</strong> R$ {selectedPayment.amount.toFixed(2)}</p>
              {selectedPayment.pix_copy_paste_code && (
                <p><strong>Código PIX:</strong> <code>{selectedPayment.pix_copy_paste_code}</code></p>
              )}
              {selectedPayment.pix_expires_at && (
                <p><strong>Validade PIX:</strong> {new Date(selectedPayment.pix_expires_at).toLocaleString()}</p>
              )}
              <p><strong>Status:</strong> {selectedPayment.status}</p>
              <p><strong>Criado em:</strong> {new Date(selectedPayment.created_at).toLocaleString()}</p>
              <p><strong>Atualizado em:</strong> {new Date(selectedPayment.updated_at).toLocaleDateString()}</p>
            </section>
          </div>
        )}
      </Modal>
    </div>
  );
}

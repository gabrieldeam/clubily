// src/app/admin/referrals/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { listReferrals, listReferralCompanies } from '@/services/userService';
import type {
  ReferralDetail,
  ReferralCompanyRead,
  PaginatedReferralCompanies
} from '@/types/user';
import Notification from '@/components/Notification/Notification';
import Modal from '@/components/Modal/Modal';
import { Users } from 'lucide-react';
import styles from './page.module.css';

type ViewMode = 'table' | 'cards';
type NotificationState = { type: 'success' | 'error' | 'info'; message: string };

// Estende o ReferralDetail para incluir a contagem de empresas
type ReferralWithCount = ReferralDetail & { company_count: number };

export default function AdminReferralsPage() {
  const [referrals, setReferrals] = useState<ReferralWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 50;
  const [notification, setNotification] = useState<NotificationState | null>(null);

  // estados do modal de empresas
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<ReferralWithCount | null>(null);
  const [refComps, setRefComps] = useState<ReferralCompanyRead[]>([]);
  const [rcLoading, setRcLoading] = useState(false);
  const rcLimit = 10;
  const [rcPage, setRcPage] = useState(1);
  const [rcTotal, setRcTotal] = useState(0);

  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Busca referrals + contagem de empresas sempre que a página mudar
  useEffect(() => {
    fetchReferrals();
  }, [page]);

  async function fetchReferrals() {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      const res = await listReferrals(skip, limit);
      const referralsList: ReferralDetail[] = res.data;

      // Para cada referral, busca apenas total de empresas (skip=0, limit=1)
      const counts = await Promise.all(
        referralsList.map(r =>
          listReferralCompanies(r.referral_code, 0, 1)
            .then(resp => resp.data.total)
            .catch(() => 0)
        )
      );

      const withCounts: ReferralWithCount[] = referralsList.map((r, i) => ({
        ...r,
        company_count: counts[i],
      }));

      setReferrals(withCounts);
    } catch (e: any) {
      setNotification({ type: 'error', message: e.message || 'Erro ao buscar indicações' });
    } finally {
      setLoading(false);
    }
  }

  // Busca empresas indicadas sempre que mudar o referral selecionado ou a página no modal
  useEffect(() => {
    if (selectedReferral) {
      fetchReferralCompanies(selectedReferral.referral_code, rcPage);
    }
  }, [selectedReferral, rcPage]);

  async function fetchReferralCompanies(code: string, page: number) {
    setRcLoading(true);
    try {
      const skip = (page - 1) * rcLimit;
      const res = await listReferralCompanies(code, skip, rcLimit);
      const data: PaginatedReferralCompanies = res.data;
      setRefComps(data.items);
      setRcTotal(data.total);
    } catch {
      setRefComps([]);
      setRcTotal(0);
    } finally {
      setRcLoading(false);
    }
  }

  function openDetails(r: ReferralWithCount) {
    setSelectedReferral(r);
    setRcPage(1);
    setModalOpen(true);
  }

  function closeDetails() {
    setModalOpen(false);
    setSelectedReferral(null);
    setRefComps([]);
    setRcTotal(0);
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
        <h1>Indicações</h1>
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

      {loading ? (
        <p>Carregando indicações...</p>
      ) : viewMode === 'table' ? (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Código</th>
                <th>Usuário</th>
                <th>Empresas</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map(r => (
                <tr key={r.id}>
                  <td data-label="Código">{r.referral_code}</td>
                  <td data-label="Usuário">{r.user.name}</td>
                  <td data-label="Empresas">{r.company_count}</td>
                  <td data-label="Data">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td data-label="Ações" className={styles.actions}>
                    <button
                      className={styles.btnDetail}
                      onClick={() => openDetails(r)}
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
          {referrals.map(r => (
            <div key={r.id} className={styles.card}>
              <Users size={40} className={styles.cardIcon} />
              <div className={styles.cardBody}>
                <h2>{r.referral_code}</h2>
                <p>{r.user.name}</p>
                <span className={styles.subText}>
                  {r.company_count} empresas
                </span>
              </div>
              <button
                className={styles.btnDetail}
                onClick={() => openDetails(r)}
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
        <span>{page}</span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={referrals.length < limit}
        >
          Próxima →
        </button>
      </div>

      <Modal open={modalOpen} onClose={closeDetails} width={600}>
        <div className={styles.detail}>
          <h2>Código: {selectedReferral?.referral_code}</h2>

          <section>
            <h3>Usuário</h3>
            <p>
              <strong>Nome:</strong> {selectedReferral?.user.name}
            </p>
            <p>
              <strong>Email:</strong> {selectedReferral?.user.email}
            </p>
          </section>

          <section>
            <h3>Empresas Indicadas ({rcTotal})</h3>
            {rcLoading ? (
              <p>Carregando empresas...</p>
            ) : refComps.length ? (
              <>
                <div className={styles.cardsGrid}>
                  {refComps.map(c => (
                    <div key={c.id} className={styles.cardSmall}>
                      <h4>{c.name}</h4>
                      <p><strong>Email:</strong> {c.email}</p>
                      <p><strong>Telefone:</strong> {c.phone}</p>
                      <p><strong>CNPJ:</strong> {c.cnpj}</p>
                    </div>
                  ))}
                </div>
                <div className={styles.pagination}>
                  <button
                    onClick={() => setRcPage(p => Math.max(1, p - 1))}
                    disabled={rcPage === 1}
                  >
                    ← Anterior
                  </button>
                  <span>
                    {rcPage} / {Math.ceil(rcTotal / rcLimit) || 1}
                  </span>
                  <button
                    onClick={() => setRcPage(p => p + 1)}
                    disabled={rcPage >= Math.ceil(rcTotal / rcLimit)}
                  >
                    Próxima →
                  </button>
                </div>
              </>
            ) : (
              <p>Nenhuma empresa indicada.</p>
            )}
          </section>
        </div>
      </Modal>
    </div>
  );
}

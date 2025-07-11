'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  listAdminPrograms,
  listProgramAssociations,
} from '@/services/cashbackAdminProgramService';
import type {
  AdminProgramRead,
  PaginatedAdminPrograms,
  ProgramUsageAssociation,
  PaginatedAssociations,
} from '@/types/cashbackAdminProgram';
import Notification from '@/components/Notification/Notification';
import Modal from '@/components/Modal/Modal';
import { Gift } from 'lucide-react';
import styles from './page.module.css';

type ViewMode = 'table' | 'cards';
type NotificationState = { type: 'success' | 'error' | 'info'; message: string };

export default function AdminCashbackProgramsPage() {
  const [programs, setPrograms] = useState<AdminProgramRead[]>([]);
  const [assocCounts, setAssocCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const [page, setPage] = useState(1);
  const limit = 10;
  const [total, setTotal] = useState(0);

  const [viewMode, setViewMode] = useState<ViewMode>('table');

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProg, setSelectedProg] = useState<AdminProgramRead | null>(null);

  // associações paginadas na modal
  const [assocPage, setAssocPage] = useState(1);
  const assocLimit = 4; // mostra 4 cards por página
  const [assocTotal, setAssocTotal] = useState(0);
  const [associations, setAssociations] = useState<ProgramUsageAssociation[]>([]);
  const [assocLoading, setAssocLoading] = useState(false);

  // Memoiza fetchPrograms para não disparar warning de deps
  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      const res = await listAdminPrograms(skip, limit);
      const data: PaginatedAdminPrograms = res.data;
      setPrograms(data.items);
      setTotal(data.total);

      // busca total de associações para cada programa
      const counts = await Promise.all(
        data.items.map(async (p) => {
          try {
            const assocRes = await listProgramAssociations(p.id, 0, 1);
            return [p.id, assocRes.data.total] as [string, number];
          } catch {
            return [p.id, 0] as [string, number];
          }
        })
      );
      setAssocCounts(Object.fromEntries(counts));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar programas';
      setNotification({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);


  // quando abre modal ou muda de página de associações
  useEffect(() => {
    if (selectedProg) {
      fetchAssociations(selectedProg.id, assocPage);
    }
  }, [selectedProg, assocPage]);

  async function fetchAssociations(programId: string, page: number) {
    setAssocLoading(true);
    try {
      const skip = (page - 1) * assocLimit;
      const res = await listProgramAssociations(programId, skip, assocLimit);
      const data: PaginatedAssociations = res.data;
      setAssociations(data.items);
      setAssocTotal(data.total);
    } catch {
      setAssociations([]);
      setAssocTotal(0);
    } finally {
      setAssocLoading(false);
    }
  }

  function openDetails(p: AdminProgramRead) {
    setSelectedProg(p);
    setModalOpen(true);
    setAssocPage(1);
  }

  function closeDetails() {
    setModalOpen(false);
    setSelectedProg(null);
    setAssociations([]);
    setAssocTotal(0);
  }

  const lastPage = Math.ceil(total / limit);
  const lastAssocPage = Math.ceil(assocTotal / assocLimit) || 1;

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
        <h1>Programas de Cashback</h1>
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
        <p>Carregando programas...</p>
      ) : viewMode === 'table' ? (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Empresa</th>
                <th>% Cashback</th>
                <th>Validade</th>
                <th>Ativo?</th>
                <th>Associações</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {programs.map((p) => (
                <tr key={p.id}>
                  <td data-label="Nome">{p.name}</td>
                  <td data-label="Empresa">{p.company.name}</td>
                  <td data-label="% Cashback">{p.percent}%</td>
                  <td data-label="Validade">{p.validity_days} dias</td>
                  <td data-label="Ativo?">{p.is_active ? 'Sim' : 'Não'}</td>
                  <td data-label="Associações">{assocCounts[p.id] ?? 0}</td>
                  <td data-label="Ações" className={styles.actions}>
                    <button className={styles.btnDetail} onClick={() => openDetails(p)}>
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
          {programs.map((p) => (
            <div key={p.id} className={styles.card}>
              <Gift size={40} className={styles.cardIcon} />
              <div className={styles.cardBody}>
                <h2>{p.name}</h2>
                <p className={styles.subText}>{p.company.name}</p>
                <span className={styles.badgePercent}>{p.percent}%</span>
              </div>
              <button className={styles.btnDetail} onClick={() => openDetails(p)}>
                Detalhes
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={styles.pagination}>
        <button disabled={page === 1} onClick={() => setPage((x) => Math.max(1, x - 1))}>
          ← Anterior
        </button>
        <span>
          {page} / {lastPage}
        </span>
        <button disabled={page === lastPage} onClick={() => setPage((x) => Math.min(lastPage, x + 1))}>
          Próxima →
        </button>
      </div>

      <Modal open={modalOpen} onClose={closeDetails} width={700}>
        {selectedProg && (
          <div className={styles.detail}>
            <h2>{selectedProg.name}</h2>
            <div className={styles.company}>
              <section>
                <h3>Empresa</h3>
                <p><strong>Nome:</strong> {selectedProg.company.name}</p>
                <p><strong>Email:</strong> {selectedProg.company.email}</p>
                {selectedProg.company.phone && (
                  <p><strong>Telefone:</strong> {selectedProg.company.phone}</p>
                )}
                <p><strong>CNPJ:</strong> {selectedProg.company.cnpj}</p>
              </section>
              <section>
                <h3>Detalhes do Programa</h3>
                <p><strong>Descrição:</strong> {selectedProg.description}</p>
                <p><strong>Percentual:</strong> {selectedProg.percent}%</p>
                <p><strong>Validade:</strong> {selectedProg.validity_days} dias</p>
                <p><strong>Visível:</strong> {selectedProg.is_visible ? 'Sim' : 'Não'}</p>
                <p><strong>Criado em:</strong> {new Date(selectedProg.created_at).toLocaleString()}</p>
                <p><strong>Atualizado em:</strong> {new Date(selectedProg.updated_at).toLocaleString()}</p>
              </section>
            </div>
            <section>
              <h3>Associações</h3>
              {assocLoading ? (
                <p>Carregando associações...</p>
              ) : (
                <>
                  <div className={styles.cardsGrid}>
                    {associations.map((a) => (
                      <div key={a.id} className={styles.cardSmall}>
                        <p><strong>Usuário:</strong> {a.user_name}</p>
                        <p><strong>Gasto:</strong> R$ {a.amount_spent.toFixed(2)}</p>
                        <p><strong>Cashback:</strong> R$ {a.cashback_value.toFixed(2)}</p>
                        <p><strong>Ativo:</strong> {a.is_active ? 'Sim' : 'Não'}</p>
                        <p><strong>Expira:</strong> {new Date(a.expires_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                  <div className={styles.pagination}>
                    <button
                      disabled={assocPage === 1}
                      onClick={() => setAssocPage((x) => Math.max(1, x - 1))}
                    >
                      ← Anterior
                    </button>
                    <span>{assocPage} / {lastAssocPage}</span>
                    <button
                      disabled={assocPage === lastAssocPage}
                      onClick={() => setAssocPage((x) => Math.min(lastAssocPage, x + 1))}
                    >
                      Próxima →
                    </button>
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </Modal>
    </div>
  );
}

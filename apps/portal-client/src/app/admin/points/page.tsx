// src/app/admin/points/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { listAllRules, listRuleTransactions } from '@/services/pointsAdminService';
import type {
  PaginatedRules,
  PaginatedUserPointsTransactions,
  PointsRuleWithCompany,
  AdminUserPointsTransactionRead
} from '@/types/pointsAdmin';
import Notification from '@/components/Notification/Notification';
import Modal from '@/components/Modal/Modal';
import { Users } from 'lucide-react';
import styles from './page.module.css';

type ViewMode = 'table' | 'cards';
type NotificationState = { type: 'success' | 'error' | 'info'; message: string };

// Estende PointsRuleWithCompany para incluir a contagem de transações
interface RuleWithCount extends PointsRuleWithCompany {
  transaction_count: number;
}

export default function AdminPointsPage() {
  const [rules, setRules] = useState<RuleWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 50;
  const [notification, setNotification] = useState<NotificationState | null>(null);

  // estados do modal de transações
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<RuleWithCount | null>(null);
  const [transactions, setTransactions] = useState<AdminUserPointsTransactionRead[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const txLimit = 10;
  const [txPage, setTxPage] = useState(1);
  const [txTotal, setTxTotal] = useState(0);

  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Busca regras + contagem de transações sempre que a página mudar
  useEffect(() => {
    fetchRules();
  }, [page]);

  async function fetchRules() {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      const res = await listAllRules(skip, limit);
      const rulesList: PointsRuleWithCompany[] = res.data.items;

      // Para cada regra, busca apenas total de transações (skip=0, limit=1)
      const counts = await Promise.all(
        rulesList.map(r =>
          listRuleTransactions(r.id, 0, 1)
            .then(resp => resp.data.total)
            .catch(() => 0)
        )
      );

      const withCounts: RuleWithCount[] = rulesList.map((r, i) => ({
        ...r,
        transaction_count: counts[i],
      }));

      setRules(withCounts);
    } catch (e: any) {
      setNotification({ type: 'error', message: e.message || 'Erro ao buscar regras' });
    } finally {
      setLoading(false);
    }
  }

  // Busca transações sempre que mudar a regra selecionada ou a página no modal
  useEffect(() => {
    if (selectedRule) {
      fetchRuleTransactions(selectedRule.id, txPage);
    }
  }, [selectedRule, txPage]);

  async function fetchRuleTransactions(ruleId: string, page: number) {
    setTxLoading(true);
    try {
      const skip = (page - 1) * txLimit;
      const res = await listRuleTransactions(ruleId, skip, txLimit);
      const data: PaginatedUserPointsTransactions = res.data;
      setTransactions(data.items);
      setTxTotal(data.total);
    } catch {
      setTransactions([]);
      setTxTotal(0);
    } finally {
      setTxLoading(false);
    }
  }

  function openDetails(rule: RuleWithCount) {
    setSelectedRule(rule);
    setTxPage(1);
    setModalOpen(true);
  }

  function closeDetails() {
    setModalOpen(false);
    setSelectedRule(null);
    setTransactions([]);
    setTxTotal(0);
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
        <h1>Regras de Pontos</h1>
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
        <p>Carregando regras...</p>
      ) : viewMode === 'table' ? (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Empresa</th>
                <th>Regra</th>
                <th>Transações</th>
                <th>Criado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {rules.map(r => (
                <tr key={r.id}>
                  <td data-label="ID">{r.id}</td>
                  <td data-label="Empresa">{r.company_name}</td>
                  <td data-label="Regra">{r.name}</td>
                  <td data-label="Transações">{r.transaction_count}</td>
                  <td data-label="Criado em">{new Date(r.created_at).toLocaleDateString()}</td>
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
          {rules.map(r => (
            <div key={r.id} className={styles.card}>
              <Users size={40} className={styles.cardIcon} />
              <div className={styles.cardBody}>
                <h2>{r.name}</h2>
                <p>{r.company_name}</p>
                <span className={styles.subText}>
                  {r.transaction_count} transações
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
          disabled={rules.length < limit}
        >
          Próxima →
        </button>
      </div>

      <Modal open={modalOpen} onClose={closeDetails} width={600}>
        <div className={styles.detail}>
          <h2>Regra: {selectedRule?.name}</h2>

          <section>
            <h3>Empresa</h3>
            <p><strong>Nome:</strong> {selectedRule?.company_name}</p>
          </section>

          <section>
            <h3>Transações ({txTotal})</h3>
            {txLoading ? (
              <p>Carregando transações...</p>
            ) : transactions.length ? (
              <>
                <div className={styles.cardsGrid}>
                  {transactions.map(tx => (
                    <div key={tx.id} className={styles.cardSmall}>
                      <p><strong>ID:</strong> {tx.id}</p>
                      <p><strong>Tipo:</strong> {tx.type}</p>
                      <p><strong>Valor:</strong> {tx.amount}</p>
                      {tx.description && <p><strong>Descrição:</strong> {tx.description}</p>}
                      <p><strong>Data:</strong> {new Date(tx.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
                <div className={styles.pagination}>
                  <button
                    onClick={() => setTxPage(p => Math.max(1, p - 1))}
                    disabled={txPage === 1}
                  >
                    ← Anterior
                  </button>
                  <span>{txPage} / {Math.ceil(txTotal / txLimit) || 1}</span>
                  <button
                    onClick={() => setTxPage(p => p + 1)}
                    disabled={txPage >= Math.ceil(txTotal / txLimit)}
                  >
                    Próxima →
                  </button>
                </div>
              </>
            ) : (
              <p>Nenhuma transação registrada.</p>
            )}
          </section>
        </div>
      </Modal>
    </div>
  );
}
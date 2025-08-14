'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Notification from '@/components/Notification/Notification';
import Modal from '@/components/Modal/Modal';
import {
  Building2,
  Stamp,
  Users,
  Clock,
  CalendarCheck2,
  Award,
} from 'lucide-react';
import styles from './page.module.css';

import type { CompletedCardAdmin } from '@/types/loyalty';
import { listPlatformCompletedCards } from '@/services/loyaltyService';

type ViewMode = 'table' | 'cards';
type NotificationState = { type: 'success' | 'error' | 'info'; message: string };

export default function AdminLoyaltyCompletedPage() {
  const [items, setItems] = useState<CompletedCardAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  // paginação
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [total, setTotal] = useState(0);

  // filtros
  const [companyId, setCompanyId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [userId, setUserId] = useState('');
  const [completedFrom, setCompletedFrom] = useState(''); // yyyy-mm-dd
  const [completedTo, setCompletedTo] = useState('');     // yyyy-mm-dd

  // UI
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [notification, setNotification] = useState<NotificationState | null>(null);

  // modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<CompletedCardAdmin | null>(null);

  const humanizeSeconds = (secs: number) => {
    if (!secs || secs < 0) return '—';
    const d = Math.floor(secs / 86400);
    const h = Math.floor((secs % 86400) / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const parts = [];
    if (d) parts.push(`${d}d`);
    if (h) parts.push(`${h}h`);
    if (m) parts.push(`${m}m`);
    if (!d && !h && !m) parts.push(`${s}s`);
    return parts.join(' ');
  };

  const pageCount = useMemo(
    () => (total ? Math.max(1, Math.ceil(total / pageSize)) : (items.length < pageSize ? 1 : page + 1)),
    [total, items.length, page, pageSize]
  );

  const fetchCompleted = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        page_size: pageSize,
      };
      if (companyId) params.company_id = companyId;
      if (templateId) params.template_id = templateId;
      if (userId) params.user_id = userId;
      if (completedFrom) params.completed_from = new Date(completedFrom).toISOString();
      if (completedTo) params.completed_to = new Date(completedTo).toISOString();

      const res = await listPlatformCompletedCards(params);
      setItems(res.data);

      // headers de paginação
      const hdrs = res.headers as Record<string, string>;
      const totalHeader = Number(hdrs['x-total-count'] ?? 0);
      setTotal(Number.isNaN(totalHeader) ? 0 : totalHeader);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar dados';
      setNotification({ type: 'error', message: msg });
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, companyId, templateId, userId, completedFrom, completedTo]);

  useEffect(() => {
    fetchCompleted();
  }, [fetchCompleted]);

  const resetFilters = () => {
    setCompanyId('');
    setTemplateId('');
    setUserId('');
    setCompletedFrom('');
    setCompletedTo('');
    setPage(1);
  };

  const openDetails = (row: CompletedCardAdmin) => {
    setSelected(row);
    setModalOpen(true);
  };

  const closeDetails = () => {
    setSelected(null);
    setModalOpen(false);
  };

  // métricas simples (da página atual)
  const avgTimeToComplete = useMemo(() => {
    if (!items.length) return '—';
    const sum = items.reduce((acc, it) => acc + (it.time_to_complete_seconds || 0), 0);
    return humanizeSeconds(Math.floor(sum / items.length));
  }, [items]);

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
        <h1>Cartões de Fidelidade Concluídos</h1>
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

      {/* filtros */}
      <div className={styles.filters}>
        <div className={styles.filterRow}>
          <div className={styles.filterItem}>
            <label>Empresa (ID)</label>
            <input
              type="text"
              placeholder="UUID"
              value={companyId}
              onChange={e => setCompanyId(e.target.value)}
            />
          </div>
          <div className={styles.filterItem}>
            <label>Template (ID)</label>
            <input
              type="text"
              placeholder="UUID"
              value={templateId}
              onChange={e => setTemplateId(e.target.value)}
            />
          </div>
          <div className={styles.filterItem}>
            <label>Usuário (ID)</label>
            <input
              type="text"
              placeholder="UUID"
              value={userId}
              onChange={e => setUserId(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.filterRow}>
          <div className={styles.filterItem}>
            <label>Concluído a partir de</label>
            <input
              type="date"
              value={completedFrom}
              onChange={e => setCompletedFrom(e.target.value)}
            />
          </div>
          <div className={styles.filterItem}>
            <label>Concluído até</label>
            <input
              type="date"
              value={completedTo}
              onChange={e => setCompletedTo(e.target.value)}
            />
          </div>

          <div className={styles.filterActions}>
            <button className={styles.btnFilter} onClick={() => setPage(1)}>
              Aplicar
            </button>
            <button className={styles.btnClear} onClick={resetFilters}>
              Limpar
            </button>
          </div>
        </div>
      </div>

      {/* métricas rápidas (da página) */}
      <div className={styles.kpis}>
        <div className={styles.kpiCard}>
          <CalendarCheck2 size={28} />
          <div>
            <strong>{total || items.length}</strong>
            <span>Total concluídos {total ? '(global)' : '(página)'}</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <Clock size={28} />
          <div>
            <strong>{avgTimeToComplete}</strong>
            <span>Tempo médio p/ concluir (página)</span>
          </div>
        </div>
      </div>

      {loading ? (
        <p>Carregando cartões...</p>
      ) : viewMode === 'table' ? (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Empresa</th>
                <th>Template</th>
                <th>Usuário</th>
                <th>Carimbos</th>
                <th>Concluído em</th>
                <th>Último carimbo</th>
                <th>Tempo p/ concluir</th>
                <th>Recompensas</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td data-label="ID">{it.id}</td>
                  <td data-label="Empresa">{it.company_name}</td>
                  <td data-label="Template">{it.template_title}</td>
                  <td data-label="Usuário">{it.user_email || it.user_name || it.user_id}</td>
                  <td data-label="Carimbos">
                    {it.stamps_given}/{it.stamp_total}
                  </td>
                  <td data-label="Concluído em">
                    {new Date(it.completed_at).toLocaleString()}
                  </td>
                  <td data-label="Último carimbo">
                    {it.last_stamp_at ? new Date(it.last_stamp_at).toLocaleString() : '—'}
                  </td>
                  <td data-label="Tempo p/ concluir">
                    {humanizeSeconds(it.time_to_complete_seconds)}
                  </td>
                  <td data-label="Recompensas">
                    {it.redeemed_count}/{it.total_rewards} (pend. {it.pending_count})
                  </td>
                  <td data-label="Ações" className={styles.actions}>
                    <button className={styles.btnDetail} onClick={() => openDetails(it)}>
                      Detalhes
                    </button>
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '1rem' }}>
                    Nenhum cartão concluído encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.cardsGrid}>
          {items.map((it) => (
            <div key={it.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>{it.template_title}</h2>
                <Stamp size={28} className={styles.cardIcon} />
              </div>
              <div className={styles.cardBody}>
                <p className={styles.subText}>
                  <Building2 size={16} /> {it.company_name}
                </p>
                <p className={styles.subText}>
                  <Users size={16} /> {it.user_email || it.user_name || it.user_id}
                </p>
                <p className={styles.subText}>
                  <CalendarCheck2 size={16} /> {new Date(it.completed_at).toLocaleString()}
                </p>
                <p className={styles.subText}>
                  <Clock size={16} /> {humanizeSeconds(it.time_to_complete_seconds)}
                </p>
                <p className={styles.subText}>
                  <Award size={16} /> {it.redeemed_count}/{it.total_rewards} (pend. {it.pending_count})
                </p>
                <div className={styles.progressWrap}>
                  <div
                    className={styles.progressBar}
                    style={{ width: `${Math.min(100, Math.round((it.stamps_given / Math.max(1, it.stamp_total)) * 100))}%` }}
                  />
                </div>
                <small>{it.stamps_given}/{it.stamp_total} carimbos</small>
              </div>
              <div className={styles.cardFooter}>
                <button className={styles.btnDetail} onClick={() => openDetails(it)}>
                  Detalhes
                </button>
              </div>
            </div>
          ))}
          {!items.length && <p>Nenhum cartão concluído encontrado.</p>}
        </div>
      )}

      <div className={styles.pagination}>
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          ← Anterior
        </button>
        <span>{page} {total ? `/ ${pageCount}` : ''}</span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={total ? page >= pageCount : items.length < pageSize}
        >
          Próxima →
        </button>
      </div>

      <Modal open={modalOpen} onClose={closeDetails} width={680}>
        <div className={styles.detail}>
          <h2>Cartão concluído</h2>

          <section>
            <h3>Empresa</h3>
            <p><strong>Nome:</strong> {selected?.company_name}</p>
            <p><strong>ID:</strong> {selected?.company_id}</p>
          </section>

          <section>
            <h3>Template</h3>
            <p><strong>Título:</strong> {selected?.template_title}</p>
            <p><strong>ID:</strong> {selected?.template_id}</p>
            <p><strong>Carimbos:</strong> {selected?.stamps_given}/{selected?.stamp_total}</p>
          </section>

          <section>
            <h3>Usuário</h3>
            <p><strong>ID:</strong> {selected?.user_id}</p>
            {selected?.user_name && <p><strong>Nome:</strong> {selected.user_name}</p>}
            {selected?.user_email && <p><strong>Email:</strong> {selected.user_email}</p>}
          </section>

          <section>
            <h3>Datas</h3>
            <p><strong>Emitido em:</strong> {selected ? new Date(selected.issued_at).toLocaleString() : '—'}</p>
            <p><strong>Concluído em:</strong> {selected ? new Date(selected.completed_at).toLocaleString() : '—'}</p>
            <p><strong>Último carimbo:</strong> {selected?.last_stamp_at ? new Date(selected.last_stamp_at).toLocaleString() : '—'}</p>
            <p><strong>Expira em:</strong> {selected?.expires_at ? new Date(selected.expires_at).toLocaleString() : '—'}</p>
            <p><strong>Tempo p/ concluir:</strong> {selected ? humanizeSeconds(selected.time_to_complete_seconds) : '—'}</p>
          </section>

          <section>
            <h3>Recompensas</h3>
            <p>
              <strong>Total:</strong> {selected?.total_rewards} &nbsp;|&nbsp;
              <strong>Resgatadas:</strong> {selected?.redeemed_count} &nbsp;|&nbsp;
              <strong>Pendentes:</strong> {selected?.pending_count}
            </p>
          </section>
        </div>
      </Modal>
    </div>
  );
}

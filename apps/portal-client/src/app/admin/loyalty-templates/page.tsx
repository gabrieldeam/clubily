'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Notification from '@/components/Notification/Notification';
import Modal from '@/components/Modal/Modal';
import {
  Building2,
  Stamp,
  CalendarClock,
  CalendarRange,
  Users,
  CircleEllipsis,
} from 'lucide-react';
import styles from './page.module.css';

import type { TemplateStatsAdmin } from '@/types/loyalty';
import { listPlatformTemplateStats } from '@/services/loyaltyService';

type NotificationState = { type: 'success' | 'error' | 'info'; message: string };

export default function AdminLoyaltyTemplatesPage() {
  const [items, setItems] = useState<TemplateStatsAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  // paginação
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [total, setTotal] = useState(0);

  // filtros
  const [companyId, setCompanyId] = useState('');
  const [active, setActive] = useState<'all' | 'true' | 'false'>('all');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');

  // UI
  const [notification, setNotification] = useState<NotificationState | null>(null);

  // modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<TemplateStatsAdmin | null>(null);

  const humanDate = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleString() : '—';

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | boolean> = {
        page,
        page_size: pageSize,
      };
      if (companyId) params.company_id = companyId;
      if (active !== 'all') params.active = active === 'true';
      if (createdFrom) params.created_from = new Date(createdFrom).toISOString();
      if (createdTo) params.created_to = new Date(createdTo).toISOString();

      const res = await listPlatformTemplateStats(params);
      setItems(res.data);

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
  }, [page, pageSize, companyId, active, createdFrom, createdTo]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const resetFilters = () => {
    setCompanyId('');
    setActive('all');
    setCreatedFrom('');
    setCreatedTo('');
    setPage(1);
  };

  const openDetails = (row: TemplateStatsAdmin) => {
    setSelected(row);
    setModalOpen(true);
  };

  const closeDetails = () => {
    setSelected(null);
    setModalOpen(false);
  };

  // KPIs simples (da página/resultado)
  const totals = useMemo(() => {
    const totalTemplates = total || items.length;
    const totalIssued = items.reduce((acc, it) => acc + (it.issued_total || 0), 0);
    const avgIssued = items.length ? Math.round(totalIssued / items.length) : 0;
    return { totalTemplates, totalIssued, avgIssued };
  }, [items, total]);

  const pageCount = useMemo(
    () => (total ? Math.max(1, Math.ceil(total / pageSize)) : (items.length < pageSize ? 1 : page + 1)),
    [total, items.length, page, pageSize]
  );

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
        <h1>Cartões (Templates) Criados</h1>
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
            <label>Status</label>
            <select
              value={active}
              onChange={e => setActive(e.target.value as 'all' | 'true' | 'false')}
            >
              <option value="all">Todos</option>
              <option value="true">Ativos</option>
              <option value="false">Inativos</option>
            </select>
          </div>

          <div className={styles.filterItem}>
            <label>Criado a partir de</label>
            <input
              type="date"
              value={createdFrom}
              onChange={e => setCreatedFrom(e.target.value)}
            />
          </div>
          <div className={styles.filterItem}>
            <label>Criado até</label>
            <input
              type="date"
              value={createdTo}
              onChange={e => setCreatedTo(e.target.value)}
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

      {/* KPIs */}
      <div className={styles.kpis}>
        <div className={styles.kpiCard}>
          <Stamp size={28} />
          <div>
            <strong>{totals.totalTemplates}</strong>
            <span>Templates no resultado</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <Users size={28} />
          <div>
            <strong>{totals.totalIssued}</strong>
            <span>Emissões (somatório)</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <CircleEllipsis size={28} />
          <div>
            <strong>{totals.avgIssued}</strong>
            <span>Média emissões / template</span>
          </div>
        </div>
      </div>

      {loading ? (
        <p>Carregando templates...</p>
      ) : (
        <div className={styles.cardsGrid}>
          {items.map((it) => (
            <div key={it.template_id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>{it.template_title}</h2>
                <Building2 size={24} />
              </div>
              <div className={styles.cardBody}>
                <p className={styles.subText}><strong>Empresa:</strong> {it.company_name}</p>
                <p className={styles.subText}><strong>Status:</strong>{' '}
                  <span className={it.active ? styles.badgeActive : styles.badgeInactive}>
                    {it.active ? 'Ativo' : 'Inativo'}
                  </span>
                </p>
                <p className={styles.subText}><strong>Emissões:</strong> {it.issued_total}</p>
                <p className={styles.subText}><strong>Ativos:</strong> {it.active_instances} &nbsp;|&nbsp;
                  <strong>Concluídos:</strong> {it.completed_instances}
                </p>
                <p className={styles.subText}><strong>Usuários únicos:</strong> {it.unique_users}</p>
                <p className={styles.subText}><CalendarClock size={14}/> Última emissão: {humanDate(it.last_issued_at)}</p>
                <p className={styles.subText}><CalendarRange size={14}/> Janela:
                  {' '} {it.emission_start ? new Date(it.emission_start).toLocaleDateString() : '—'}
                  {' '}→{' '}
                  {it.emission_end ? new Date(it.emission_end).toLocaleDateString() : '—'}
                </p>
              </div>
              <div className={styles.cardFooter}>
                <button className={styles.btnDetail} onClick={() => openDetails(it)}>
                  Detalhes
                </button>
              </div>
            </div>
          ))}
          {!items.length && <p>Nenhum template encontrado.</p>}
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

      <Modal open={modalOpen} onClose={closeDetails} width={720}>
        <div className={styles.detail}>
          <h2>Template</h2>

          <section>
            <h3>Identificação</h3>
            <p><strong>Título:</strong> {selected?.template_title}</p>
            <p><strong>Template ID:</strong> {selected?.template_id}</p>
            <p><strong>Empresa:</strong> {selected?.company_name} ({selected?.company_id})</p>
            <p><strong>Status:</strong>{' '}
              <span className={selected?.active ? styles.badgeActive : styles.badgeInactive}>
                {selected?.active ? 'Ativo' : 'Inativo'}
              </span>
            </p>
          </section>

          <section>
            <h3>Configuração</h3>
            <p><strong>Carimbos totais:</strong> {selected?.stamp_total}</p>
            <p><strong>Limite por usuário:</strong> {selected?.per_user_limit}</p>
            <p><strong>Janela de emissão:</strong>{' '}
              {selected?.emission_start ? new Date(selected.emission_start).toLocaleString() : '—'} →{' '}
              {selected?.emission_end ? new Date(selected.emission_end).toLocaleString() : '—'}
            </p>
            <p><strong>Limite total de emissões:</strong> {selected?.emission_limit ?? '—'}</p>
          </section>

          <section>
            <h3>Métricas</h3>
            <p><strong>Emissões totais:</strong> {selected?.issued_total}</p>
            <p><strong>Ativos:</strong> {selected?.active_instances} &nbsp;|&nbsp;
               <strong>Concluídos:</strong> {selected?.completed_instances}</p>
            <p><strong>Usuários únicos:</strong> {selected?.unique_users}</p>
            <p><strong>Última emissão:</strong> {humanDate(selected?.last_issued_at)}</p>
            <p><strong>Criado em:</strong> {selected ? new Date(selected.created_at).toLocaleString() : '—'}</p>
            <p><strong>Atualizado em:</strong> {selected ? new Date(selected.updated_at).toLocaleString() : '—'}</p>
          </section>
        </div>
      </Modal>
    </div>
  );
}

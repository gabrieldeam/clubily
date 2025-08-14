
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Notification from '@/components/Notification/Notification';
import Modal from '@/components/Modal/Modal';
import {
  TicketPercent,
  Users,
  CircleEllipsis,
  CalendarClock,
  CalendarRange,
  Building2,
  Search,
  Wallet,
  PiggyBank,
} from 'lucide-react';
import styles from './page.module.css';

import type {
  CouponStatsAdmin,
  CouponUserAggregateAdmin,
  CouponRedemptionUserAdmin,
  AdminCouponStatsParams,
  AdminCouponUsersParams,
  AdminCouponRedemptionsParams,
} from '@/types/coupon';
import {
  listPlatformCouponStats,
  listPlatformCouponUsersAggregate,
  listPlatformCouponRedemptions,
} from '@/services/couponService';

type NotificationState = { type: 'success' | 'error' | 'info'; message: string };
type ModalTab = 'users' | 'redemptions';

export default function AdminCouponsPage() {
  // lista principal
  const [items, setItems] = useState<CouponStatsAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  // paginação lista principal
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [total, setTotal] = useState(0);

  // filtros
  const [companyId, setCompanyId] = useState('');
  const [active, setActive] = useState<'all' | 'true' | 'false'>('all');
  const [visible, setVisible] = useState<'all' | 'true' | 'false'>('all');
  const [q, setQ] = useState('');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');

  // UI & notif
  const [notification, setNotification] = useState<NotificationState | null>(null);

  // modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<CouponStatsAdmin | null>(null);
  const [tab, setTab] = useState<ModalTab>('users');

  // modal: dados usuários agregados
  const [usersAgg, setUsersAgg] = useState<CouponUserAggregateAdmin[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const usersPageSize = 10;
  const [usersTotal, setUsersTotal] = useState(0);

  // modal: dados resgates detalhados
  const [reds, setReds] = useState<CouponRedemptionUserAdmin[]>([]);
  const [redsLoading, setRedsLoading] = useState(false);
  const [redsPage, setRedsPage] = useState(1);
  const redsPageSize = 10;
  const [redsTotal, setRedsTotal] = useState(0);

  const humanDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleString() : '—');

  // fetch principal
  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const params: AdminCouponStatsParams = {
        page,
        page_size: pageSize,
      };
      if (companyId) params.company_id = companyId;
      if (active !== 'all') params.active = active === 'true';
      if (visible !== 'all') params.visible = visible === 'true';
      if (q) params.q = q;
      if (createdFrom) params.created_from = new Date(createdFrom).toISOString();
      if (createdTo) params.created_to = new Date(createdTo).toISOString();

      const res = await listPlatformCouponStats(params);
      setItems(res.data);

      const hdrs = res.headers as Record<string, string>;
      const totalHeader = Number(hdrs['x-total-count'] ?? 0);
      setTotal(Number.isNaN(totalHeader) ? 0 : totalHeader);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar cupons';
      setNotification({ type: 'error', message: msg });
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, companyId, active, visible, q, createdFrom, createdTo]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const resetFilters = () => {
    setCompanyId('');
    setActive('all');
    setVisible('all');
    setQ('');
    setCreatedFrom('');
    setCreatedTo('');
    setPage(1);
  };

  const openDetails = (row: CouponStatsAdmin) => {
    setSelected(row);
    setTab('users');
    setModalOpen(true);
    setUsersPage(1);
    setRedsPage(1);
  };

  const closeDetails = () => {
    setSelected(null);
    setModalOpen(false);
    setUsersAgg([]);
    setUsersTotal(0);
    setReds([]);
    setRedsTotal(0);
  };

  // carregar abas do modal
  useEffect(() => {
    if (!selected) return;

    if (tab === 'users') {
      (async () => {
        setUsersLoading(true);
        try {
          const params: AdminCouponUsersParams = {
            page: usersPage,
            page_size: usersPageSize,
          };
          const res = await listPlatformCouponUsersAggregate(selected.coupon_id, params);
          setUsersAgg(res.data);
          const hdrs = res.headers as Record<string, string>;
          const totalHeader = Number(hdrs['x-total-count'] ?? 0);
          setUsersTotal(Number.isNaN(totalHeader) ? 0 : totalHeader);
        } catch {
          setUsersAgg([]);
          setUsersTotal(0);
        } finally {
          setUsersLoading(false);
        }
      })();
    } else if (tab === 'redemptions') {
      (async () => {
        setRedsLoading(true);
        try {
          const params: AdminCouponRedemptionsParams = {
            page: redsPage,
            page_size: redsPageSize,
          };
          const res = await listPlatformCouponRedemptions(selected.coupon_id, params);
          setReds(res.data);
          const hdrs = res.headers as Record<string, string>;
          const totalHeader = Number(hdrs['x-total-count'] ?? 0);
          setRedsTotal(Number.isNaN(totalHeader) ? 0 : totalHeader);
        } catch {
          setReds([]);
          setRedsTotal(0);
        } finally {
          setRedsLoading(false);
        }
      })();
    }
  }, [selected, tab, usersPage, redsPage]);

  // KPIs de cabeçalho (do resultado atual)
  const kpis = useMemo(() => {
    const totalCoupons = total || items.length;
    const totalUses = items.reduce((acc, it) => acc + (it.used_count || 0), 0);
    const totalDiscount = items.reduce((acc, it) => acc + (it.total_discount_applied || 0), 0);
    return {
      totalCoupons,
      totalUses,
      totalDiscount,
      avgUsesPerCoupon: items.length ? Math.round(totalUses / items.length) : 0,
    };
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
        <h1>Cupons – Visão da Plataforma</h1>
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
            <label>Visível</label>
            <select
              value={visible}
              onChange={e => setVisible(e.target.value as 'all' | 'true' | 'false')}
            >
              <option value="all">Todos</option>
              <option value="true">Visíveis</option>
              <option value="false">Ocultos</option>
            </select>
          </div>

          <div className={styles.filterItem}>
            <label>Busca</label>
            <div className={styles.inputWithIcon}>
              <Search size={16} />
              <input
                type="text"
                placeholder="nome ou código"
                value={q}
                onChange={e => setQ(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.filterItem}>
            <label>Criado de</label>
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
          <TicketPercent size={24} />
          <div>
            <strong>{kpis.totalCoupons}</strong>
            <span>Cupons no resultado</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <Users size={24} />
          <div>
            <strong>{kpis.totalUses}</strong>
            <span>Usos (somatório)</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <PiggyBank size={24} />
          <div>
            <strong>{kpis.totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            <span>Desconto total aplicado</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <CircleEllipsis size={24} />
          <div>
            <strong>{kpis.avgUsesPerCoupon}</strong>
            <span>Média usos / cupom</span>
          </div>
        </div>
      </div>

      {loading ? (
        <p>Carregando cupons...</p>
      ) : (
        <div className={styles.cardsGrid}>
          {items.map((it) => (
            <div key={it.coupon_id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>{it.name}</h2>
                <Building2 size={22} />
              </div>

              <div className={styles.cardBody}>
                <p className={styles.subText}><strong>Código:</strong> {it.code}</p>
                <p className={styles.subText}><strong>Empresa:</strong> {it.company_name}</p>
                <p className={styles.subText}>
                  <strong>Status:</strong>{' '}
                  <span className={it.is_active ? styles.badgeActive : styles.badgeInactive}>
                    {it.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                  {' '}|{' '}
                  <strong>Visível:</strong>{' '}
                  <span className={it.is_visible ? styles.badgeActive : styles.badgeInactive}>
                    {it.is_visible ? 'Sim' : 'Não'}
                  </span>
                </p>

                <p className={styles.subText}>
                  <strong>Tipo:</strong> {it.discount_type ?? '—'}
                  {' '}| <strong>Valor:</strong> {it.discount_value ?? '—'}
                </p>

                <p className={styles.subText}>
                  <strong>Usos:</strong> {it.used_count}
                  {' '}| <strong>Usuários únicos:</strong> {it.unique_users}
                </p>

                <p className={styles.subText}>
                  <Wallet size={14} />{' '}
                  <strong>Desconto total:</strong>{' '}
                  {it.total_discount_applied.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>

                <p className={styles.subText}>
                  <CalendarClock size={14} /> Último uso: {humanDate(it.last_redemption_at)}
                </p>
                <p className={styles.subText}>
                  <CalendarRange size={14} /> Criado:{' '}
                  {it.created_at ? new Date(it.created_at).toLocaleDateString() : '—'}
                </p>
              </div>

              <div className={styles.cardFooter}>
                <button className={styles.btnDetail} onClick={() => openDetails(it)}>
                  Detalhes
                </button>
              </div>
            </div>
          ))}
          {!items.length && <p>Nenhum cupom encontrado.</p>}
        </div>
      )}

      <div className={styles.pagination}>
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
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

      {/* MODAL */}
      <Modal open={modalOpen} onClose={closeDetails} width={900}>
        <div className={styles.detail}>
          <h2>Detalhes do Cupom</h2>

          <section>
            <h3>Identificação</h3>
            <p><strong>Nome:</strong> {selected?.name}</p>
            <p><strong>Código:</strong> {selected?.code}</p>
            <p><strong>Empresa:</strong> {selected?.company_name} ({selected?.company_id})</p>
            <p>
              <strong>Status:</strong>{' '}
              <span className={selected?.is_active ? styles.badgeActive : styles.badgeInactive}>
                {selected?.is_active ? 'Ativo' : 'Inativo'}
              </span>
              {' '}|{' '}
              <strong>Visível:</strong>{' '}
              <span className={selected?.is_visible ? styles.badgeActive : styles.badgeInactive}>
                {selected?.is_visible ? 'Sim' : 'Não'}
              </span>
            </p>
            <p><strong>Tipo:</strong> {selected?.discount_type ?? '—'} | <strong>Valor:</strong> {selected?.discount_value ?? '—'}</p>
            <p><strong>Criado em:</strong> {selected?.created_at ? new Date(selected.created_at).toLocaleString() : '—'}</p>
          </section>

          <section>
            <h3>Métricas</h3>
            <p><strong>Usos:</strong> {selected?.used_count}</p>
            <p><strong>Usuários únicos:</strong> {selected?.unique_users}</p>
            <p><strong>Desconto total:</strong> {selected?.total_discount_applied.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p><strong>Último uso:</strong> {humanDate(selected?.last_redemption_at)}</p>
          </section>

          {/* Abas */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tabBtn} ${tab === 'users' ? styles.tabActive : ''}`}
              onClick={() => setTab('users')}
            >
              Usuários
            </button>
            <button
              className={`${styles.tabBtn} ${tab === 'redemptions' ? styles.tabActive : ''}`}
              onClick={() => setTab('redemptions')}
            >
              Resgates
            </button>
          </div>

          {/* Conteúdo da aba: Usuários */}
          {tab === 'users' && (
            <section>
              <h3>Usuários que usaram</h3>
              {usersLoading ? (
                <p>Carregando...</p>
              ) : usersAgg.length ? (
                <>
                  <div className={styles.cardsGridInner}>
                    {usersAgg.map(u => (
                      <div key={u.user_id} className={styles.cardSmall}>
                        <p><strong>Usuário:</strong> {u.user_name ?? '—'}</p>
                        <p><strong>Email:</strong> {u.user_email ?? '—'}</p>
                        <p><strong>Usos:</strong> {u.uses_count}</p>
                        <p><strong>Total desconto:</strong> {u.total_discount_applied.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p><strong>Total amount:</strong> {u.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p><strong>Primeiro uso:</strong> {humanDate(u.first_used_at)}</p>
                        <p><strong>Último uso:</strong> {humanDate(u.last_used_at)}</p>
                      </div>
                    ))}
                  </div>
                  <div className={styles.pagination}>
                    <button onClick={() => setUsersPage(p => Math.max(1, p - 1))} disabled={usersPage === 1}>
                      ← Anterior
                    </button>
                    <span>
                      {usersPage} / {Math.max(1, Math.ceil(usersTotal / usersPageSize))}
                    </span>
                    <button
                      onClick={() => setUsersPage(p => p + 1)}
                      disabled={usersPage >= Math.ceil(usersTotal / usersPageSize)}
                    >
                      Próxima →
                    </button>
                  </div>
                </>
              ) : (
                <p>Nenhum usuário encontrado.</p>
              )}
            </section>
          )}

          {/* Conteúdo da aba: Resgates */}
          {tab === 'redemptions' && (
            <section>
              <h3>Resgates</h3>
              {redsLoading ? (
                <p>Carregando...</p>
              ) : reds.length ? (
                <>
                  <div className={styles.cardsGridInner}>
                    {reds.map(r => (
                      <div key={r.redemption_id} className={styles.cardSmall}>
                        <p><strong>ID:</strong> {r.redemption_id}</p>
                        <p><strong>Usuário:</strong> {r.user_name ?? '—'} ({r.user_email ?? '—'})</p>
                        <p><strong>Valor pedido:</strong> {r.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p><strong>Desconto:</strong> {r.discount_applied.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        {r.source_location_name && <p><strong>Origem:</strong> {r.source_location_name}</p>}
                        {(r.redemption_lat != null && r.redemption_lng != null) && (
                          <p><strong>Lat/Lng:</strong> {r.redemption_lat}, {r.redemption_lng}</p>
                        )}
                        <p><strong>Data:</strong> {new Date(r.created_at).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                  <div className={styles.pagination}>
                    <button onClick={() => setRedsPage(p => Math.max(1, p - 1))} disabled={redsPage === 1}>
                      ← Anterior
                    </button>
                    <span>
                      {redsPage} / {Math.max(1, Math.ceil(redsTotal / redsPageSize))}
                    </span>
                    <button
                      onClick={() => setRedsPage(p => p + 1)}
                      disabled={redsPage >= Math.ceil(redsTotal / redsPageSize)}
                    >
                      Próxima →
                    </button>
                  </div>
                </>
              ) : (
                <p>Nenhum resgate encontrado.</p>
              )}
            </section>
          )}
        </div>
      </Modal>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header/Header';
import Modal from '@/components/Modal/Modal';
import CalendarRange from '@/components/CalendarRange/CalendarRange';

import styles from './page.module.css';

import { getCoupon } from '@/services/couponService';
import {
  fetchCouponSummaryById,
  fetchCouponUsage,
} from '@/services/couponMetricsService';

import type { CouponRead } from '@/types/coupon';
import type {
  CouponMetricsSummary,
  PaginatedCouponUsage,
} from '@/types/couponMetrics';
import type { AxiosResponse } from 'axios';

// --- helpers ---
function isAxiosResponse<T>(v: unknown): v is AxiosResponse<T> {
  return typeof v === 'object' && v !== null && 'data' in v;
}

function unwrap<T>(maybe: T | AxiosResponse<T>): T {
  return isAxiosResponse<T>(maybe) ? maybe.data : (maybe as T);
}

function fmtBRL(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}
function pct(n?: number | null) {
  if (n == null) return '-';
  return `${Number(n).toFixed(2)}%`;
}

export default function CouponDetailPage() {
  // aceita /programs/coupons/[id] e variações
  const rawParams = useParams() as Record<'id' | 'couponId' | 'coupon_id', string | string[] | undefined>;
  const couponId =
    (Array.isArray(rawParams.id) ? rawParams.id[0] : rawParams.id) ??
    (Array.isArray(rawParams.couponId) ? rawParams.couponId[0] : rawParams.couponId) ??
    (Array.isArray(rawParams.coupon_id) ? rawParams.coupon_id[0] : rawParams.coupon_id);

  const [coupon, setCoupon] = useState<CouponRead | null>(null);
  const [summary, setSummary] = useState<CouponMetricsSummary | null>(null);
  const [usage, setUsage] = useState<PaginatedCouponUsage | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // date range (botão + modal com CalendarRange)
  const today = new Date();
  const [startDate, setStartDate] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));
  const [endDate, setEndDate] = useState<Date>(new Date(today.getFullYear(), today.getMonth() + 1, 0));
  const [dateModalOpen, setDateModalOpen] = useState(false);

  // paginação dos usos
  const [page, setPage] = useState(0);
  const limit = 10;

  // busca local na página atual
  const [search, setSearch] = useState('');

  const dateFrom = isoDate(startDate);
  const dateTo = isoDate(endDate);

  async function loadAll() {
    if (!couponId) return;
    setLoading(true);
    setError(null);
    try {
      const [c, s, u] = await Promise.all([
        getCoupon(couponId), // CouponRead ou AxiosResponse<CouponRead>
        fetchCouponSummaryById(couponId, dateFrom, dateTo),
        fetchCouponUsage(couponId, dateFrom, dateTo, page * limit, limit),
      ]);

      setCoupon(unwrap<CouponRead>(c));
      setSummary(unwrap<CouponMetricsSummary>(s));
      setUsage(unwrap<PaginatedCouponUsage>(u));
    } catch (e) {
      console.error(e);
      setError('Erro ao carregar dados do cupom.');
    } finally {
      setLoading(false);
    }
  }

  // carrega inicial e quando trocar id
  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couponId]);

  // recarrega quando mudar o período
  useEffect(() => {
    if (!couponId) return;
    setPage(0); // volta pra primeira página ao mudar período
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  // recarrega usos ao mudar de página
  useEffect(() => {
    if (!couponId) return;
    setLoadingUsage(true);
    fetchCouponUsage(couponId, dateFrom, dateTo, page * limit, limit)
      .then((u) => setUsage(unwrap<PaginatedCouponUsage>(u)))
      .catch((e) => {
        console.error(e);
        setError('Erro ao carregar usos do cupom');
      })
      .finally(() => setLoadingUsage(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // dados filtrados por busca (na página atual)
  const filteredUsage = useMemo(() => {
    if (!usage) return null;
    if (!search.trim()) return usage;
    const term = search.toLowerCase();
    return {
      ...usage,
      items: usage.items.filter(
        (it) =>
          (it.user_name || '').toLowerCase().includes(term) ||
          it.user_id.toLowerCase().includes(term) ||
          (it.source_location_name || '').toLowerCase().includes(term)
      ),
    };
  }, [usage, search]);

  if (!couponId) return <div className={styles.loading}>Carregando ID...</div>;
  if (loading) return <div className={styles.loading}>Carregando...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!coupon || !summary) return <div className={styles.error}>Cupom não encontrado.</div>;

  const totalPages = Math.max(1, Math.ceil((usage?.total ?? 0) / limit));

  return (
    <>
      <Header />
      <div className={styles.container}>
        <main className={styles.main}>
          {/* Header simples + seletor de data como no exemplo de "rules" */}
          <section className={styles.header}>
            <h1>
              {coupon.name}{' '}
              <small className={styles.smallCode}>({coupon.code})</small>
            </h1>
            <button
              className={styles.rangeBtn}
              onClick={() => setDateModalOpen(true)}
            >
              {startDate.toLocaleDateString()} – {endDate.toLocaleDateString()}
            </button>
          </section>

          {/* KPIs */}
          <section className={styles.metrics}>
            <div>
              <span>Uso</span>
              <strong>{summary.total_redemptions}</strong>
            </div>
            <div>
              <span>Desconto Total</span>
              <strong>{fmtBRL(summary.total_discount)}</strong>
            </div>
            <div>
              <span>Usuários Únicos</span>
              <strong>{summary.unique_users}</strong>
            </div>
            <div>
              <span>Média por Usuário</span>
              <strong>{summary.avg_uses_per_user.toFixed(2)}</strong>
            </div>
          </section>

          {/* Propriedades do cupom */}
          <section className={styles.props}>
            <div><strong>Tipo</strong> {coupon.discount_type ?? 'rastreamento'}</div>
            <div>
              <strong>Valor</strong>{' '}
              {coupon.discount_type
                ? coupon.discount_type === 'percent'
                  ? pct(coupon.discount_value)
                  : fmtBRL(Number(coupon.discount_value || 0))
                : '-'}
            </div>
            <div>
              <strong>Mín. Pedido</strong>{' '}
              {coupon.min_order_amount != null ? fmtBRL(Number(coupon.min_order_amount)) : '-'}
            </div>
            <div><strong>Status</strong> {coupon.is_active ? 'Ativo' : 'Inativo'}</div>
            <div><strong>Visível</strong> {coupon.is_visible ? 'Sim' : 'Não'}</div>
          </section>

          {/* Lista de usos */}
          <section className={styles.usage}>
            <div className={styles.usageHeader}>
              <h4>Usos no período</h4>
              <input
                className={styles.search}
                placeholder="Buscar por usuário"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {loadingUsage || !filteredUsage ? (
              <div className={styles.loading}>Carregando usos...</div>
            ) : filteredUsage.items.length === 0 ? (
              <div className={styles.loading}>Sem usos no período.</div>
            ) : (
              <div className={styles.tableWrapper}>
                <div className={styles.tableHeader}>
                  <div className={styles.colCliente}>Usuário</div>
                  <div className={styles.colGasto}>Valor do Pedido</div>
                  <div className={styles.colCashback}>Desconto Aplicado</div>
                  <div className={styles.colDate}>Data</div>
                </div>
                <div className={styles.tableBody}>
                  {filteredUsage.items.map((it) => (
                    <div className={styles.tableRow} key={it.id}>
                      <div className={styles.colCliente} data-label="Usuário:">
                        {it.user_name || it.user_id}
                      </div>
                      <div className={styles.colGasto} data-label="Valor do Pedido:">
                        {fmtBRL(it.amount)}
                      </div>
                      <div className={styles.colCashback} data-label="Desconto Aplicado:">
                        {fmtBRL(it.discount_applied)}
                      </div>
                      <div className={styles.colDate} data-label="Data:">
                        {new Date(it.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {usage && (
              <div className={styles.pagination}>
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Anterior
                </button>
                <span>
                  Página {page + 1} de {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => (p + 1 < totalPages ? p + 1 : p))}
                  disabled={page + 1 >= totalPages}
                >
                  Próxima
                </button>
              </div>
            )}
          </section>

          {/* Modal de seleção de período com CalendarRange */}
          <Modal open={dateModalOpen} onClose={() => setDateModalOpen(false)} width={520}>
            <div className={styles.calendarDropdown}>
              <CalendarRange
                selectedStartDate={startDate}
                selectedEndDate={endDate}
                onRangeChange={(s, e) => {
                  setStartDate(s);
                  if (e) {
                    setEndDate(e);
                    setDateModalOpen(false);
                  }
                }}
              />
              <div className={styles.presetsWrapper}>
                <button
                  className={styles.presetBtn}
                  onClick={() => {
                    const now = new Date();
                    setStartDate(new Date(now.getFullYear(), now.getMonth(), 1));
                    setEndDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
                    setDateModalOpen(false);
                  }}
                >
                  Este mês
                </button>
                <button
                  className={styles.presetBtn}
                  onClick={() => {
                    const now = new Date();
                    const from = new Date(now);
                    from.setDate(now.getDate() - 6);
                    setStartDate(from);
                    setEndDate(now);
                    setDateModalOpen(false);
                  }}
                >
                  Últimos 7 dias
                </button>
                <button
                  className={styles.presetBtn}
                  onClick={() => {
                    const now = new Date();
                    const from = new Date(now);
                    from.setDate(now.getDate() - 29);
                    setStartDate(from);
                    setEndDate(now);
                    setDateModalOpen(false);
                  }}
                >
                  Últimos 30 dias
                </button>
                <button
                  className={styles.presetBtn}
                  onClick={() => {
                    const now = new Date();
                    setStartDate(new Date(now.getFullYear(), 0, 1));
                    setEndDate(now);
                    setDateModalOpen(false);
                  }}
                >
                  Ano (YTD)
                </button>
              </div>
            </div>
          </Modal>
        </main>
      </div>
    </>
  );
}

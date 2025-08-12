'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { isAxiosError } from 'axios';
import Modal from '@/components/Modal/Modal';
import Notification from '@/components/Notification/Notification';
import {
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getCoupon,
} from '@/services/couponService';
import type { CouponRead, CouponCreate } from '@/types/coupon';
import CouponModal from '@/components/CouponsMain/CouponModal/CouponModal';
import styles from './CouponsMain.module.css';

function fmtBRL(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const VIEW_MODE_KEY = 'couponsViewMode';

export default function CouponsMain() {
  /* ---------- state ---------- */
  const [coupons, setCoupons] = useState<CouponRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<CouponRead | null>(null);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [isMobile, setIsMobile] = useState(false);

  // paginação simples
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  /* ---------- responsive / persist view mode ---------- */
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);

    // recupera modo salvo (apenas desktop)
    const saved = localStorage.getItem(VIEW_MODE_KEY) as 'list' | 'card' | null;
    if (saved) setViewMode(saved);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setViewMode('card');
    } else {
      // salva preferência do usuário no desktop
      localStorage.setItem(VIEW_MODE_KEY, viewMode);
    }
  }, [isMobile, viewMode]);

  /* ---------- fetch ---------- */
  const fetchCoupons = async (opts?: { skip?: number; limit?: number }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await listCoupons({
        skip: opts?.skip ?? skip,
        limit: opts?.limit ?? limit,
      });
      setCoupons(res.data.items);
      setTotalCount(res.data.total);
      if (opts?.skip !== undefined) setSkip(opts.skip);
      if (opts?.limit !== undefined) setLimit(opts.limit);
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.detail ?? 'Erro ao carregar cupons');
      } else {
        setError('Erro ao carregar cupons');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- derived ---------- */
  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(totalCount / Math.max(1, limit))),
    [totalCount, limit]
  );
  const currentPage = useMemo(
    () => Math.floor(skip / Math.max(1, limit)) + 1,
    [skip, limit]
  );
  const activeCount = useMemo(
    () => coupons.filter(c => c.is_active).length,
    [coupons]
  );
  const visibleCount = useMemo(
    () => coupons.filter(c => c.is_visible).length,
    [coupons]
  );

  /* ---------- CRUD helpers ---------- */
  const openCreate = () => {
    setError(null);
    setSelected(null);
    setModalOpen(true);
  };

  const openEdit = async (c: CouponRead) => {
    setError(null);
    try {
      const res = await getCoupon(c.id);
      setSelected(res.data);
    } catch {
      setSelected(c);
    }
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este cupom?')) return;
    setError(null);
    try {
      await deleteCoupon(id);
      await fetchCoupons();
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.detail ?? 'Erro ao excluir cupom');
      } else {
        setError('Erro ao excluir cupom');
      }
    }
  };

const handleSave = async (data: CouponCreate, id?: string) => {
  setError(null);
  try {
    if (id) {
      await updateCoupon(id, data);
    } else {
      await createCoupon(data);
    }
    setModalOpen(false);
    await fetchCoupons();
  } catch (err) {
    // pegue a mensagem do backend
    let msg = 'Erro ao salvar cupom';
    if (isAxiosError(err)) {
      msg = err.response?.data?.detail ?? msg;
    } else if (err instanceof Error) {
      msg = err.message || msg;
    }
    setError(msg);      // opcional (banner na lista)
    throw new Error(msg); // <-- IMPORTANTE para o modal exibir Notification
  }
};


  const fmtDiscount = (c: CouponRead) => {
    if (!c.discount_type || c.discount_value == null) return '—';
    if (c.discount_type === 'percent') return `${c.discount_value}%`;
    return fmtBRL(Number(c.discount_value));
  };

  /* ---------- render ---------- */
  return (
    <main className={styles.main}>
      <div className={styles.topBar}>
        <div className={styles.summary}>
          <h2>Cupons</h2>
          {!isMobile && (
            <>
              <div>
                Total <strong>{totalCount}</strong>
              </div>
              <div>
                Ativos (pág.) <strong>{activeCount}</strong>
              </div>
              <div>
                Visíveis (pág.) <strong>{visibleCount}</strong>
              </div>
            </>
          )}
        </div>

        {error && !isMobile && (
          <Notification
            type="error"
            message={error}
            onClose={() => setError(null)}
          />
        )}

        <div className={styles.actionsHeader}>
          <button className={styles.addBtn} onClick={openCreate}>
            + Novo Cupom
          </button>
          {!isMobile && (
            <button
              className={styles.viewToggleBtn}
              onClick={() => setViewModalOpen(true)}
              title="Modo de visualização"
            >
              ⋮
            </button>
          )}
        </div>
      </div>

      {error && isMobile && (
        <Notification
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {loading ? (
        <p className={styles.loading}>Carregando cupons...</p>
      ) : totalCount === 0 ? (
        <div className={styles.empty}>
          <h2>Você ainda não criou nenhum cupom</h2>
          <p>Crie seu primeiro cupom para impulsionar suas vendas.</p>
          <button className={styles.createBtn} onClick={openCreate}>
            Criar Cupom
          </button>
        </div>
      ) : viewMode === 'list' ? (
        <>
          <div className={styles.tableWrapper}>
            <div className={styles.tableHeader}>
              <div className={styles.colName}>Nome</div>
              <div className={styles.colCode}>Código</div>
              <div className={styles.colDiscount}>Desconto</div>
              <div className={styles.colMinOrder}>Min. Pedido</div>
              <div className={styles.colStatus}>Status</div>
              <div className={styles.colVisible}>Visível</div>
              <div className={styles.colActions}>Ações</div>
            </div>
            <div className={styles.tableBody}>
              {coupons.map(c => (
                <div key={c.id} className={styles.tableRow}>
                  <div className={styles.colName} data-label="Nome:">
                    {c.name}
                  </div>
                  <div className={styles.colCode} data-label="Código:">
                    <code>{c.code}</code>
                  </div>
                  <div className={styles.colDiscount} data-label="Desconto:">
                    {fmtDiscount(c)}
                  </div>
                  <div className={styles.colMinOrder} data-label="Min. Pedido:">
                    {c.min_order_amount != null ? fmtBRL(Number(c.min_order_amount)) : '—'}
                  </div>
                  <div className={styles.colStatus} data-label="Status:">
                    {c.is_active ? 'Ativo' : 'Inativo'}
                  </div>
                  <div className={styles.colVisible} data-label="Visível:">
                    {c.is_visible ? 'Sim' : 'Não'}
                  </div>
                  <div className={styles.colActions}>
                    <Link
                      href={`/programs/coupons/${c.id}`}
                      className={styles.view}
                      title="Ver detalhes"
                    >
                      🔍
                    </Link>
                    <button
                      className={styles.edit}
                      onClick={() => openEdit(c)}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      className={styles.delete}
                      onClick={() => handleDelete(c.id)}
                      title="Excluir"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* paginação */}
          <div className={styles.pagination}>
            <button
              disabled={currentPage <= 1}
              onClick={() => fetchCoupons({ skip: Math.max(0, skip - limit) })}
            >
              Anterior
            </button>
            <span>
              Página <strong>{currentPage}</strong> de <strong>{pageCount}</strong>
            </span>
            <button
              disabled={currentPage >= pageCount}
              onClick={() => fetchCoupons({ skip: skip + limit })}
            >
              Próxima
            </button>

            <select
              value={limit}
              onChange={e =>
                fetchCoupons({ skip: 0, limit: Number(e.target.value) })
              }
              className={styles.pageSize}
            >
              {[10, 20, 50, 100].map(n => (
                <option key={n} value={n}>
                  {n}/página
                </option>
              ))}
            </select>
          </div>
        </>
      ) : (
        <div className={styles.cardGrid}>
          {coupons.map(c => (
            <div
              key={c.id}
              className={styles.card}
              onClick={() => openEdit(c)}
              role="button"
              tabIndex={0}
            >
              <div className={styles.cardHeader}>
                <h3>{c.name}</h3>
                <span className={styles.cardBadge}>{fmtDiscount(c)}</span>
              </div>
              <p className={styles.cardSubtitle}>{c.description ?? '—'}</p>
              <div className={styles.cardDetails}>
                <p>
                  <strong>Código:</strong> <code>{c.code}</code>
                </p>
                <p>
                  <strong>Status:</strong> {c.is_active ? 'Ativo' : 'Inativo'}
                </p>
                <p>
                  <strong>Visível:</strong> {c.is_visible ? 'Sim' : 'Não'}
                </p>
                <p>
                  <strong>Min. Pedido:</strong>{' '}
                  {c.min_order_amount != null ? fmtBRL(Number(c.min_order_amount)) : '—'}
                </p>
              </div>
              <div className={styles.cardActions}>
                <Link
                  href={`/coupons/${c.id}`}
                  className={styles.view}
                  onClick={e => e.stopPropagation()}
                  title="Ver detalhes"
                >
                  🔍 Ver
                </Link>
                <button
                  className={styles.edit}
                  onClick={e => {
                    e.stopPropagation();
                    openEdit(c);
                  }}
                  title="Editar"
                >
                  ✏️ Editar
                </button>
                <button
                  className={styles.delete}
                  onClick={e => {
                    e.stopPropagation();
                    handleDelete(c.id);
                  }}
                  title="Excluir"
                >
                  🗑️ Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* view-mode modal */}
      <Modal open={viewModalOpen} onClose={() => setViewModalOpen(false)}>
        <div className={styles.viewModeModal}>
          <h2>Modo de visualização</h2>
          <div className={styles.viewOptions}>
            <button
              onClick={() => {
                setViewMode('list');
                setViewModalOpen(false);
              }}
            >
              📄 Lista
            </button>
            <button
              onClick={() => {
                setViewMode('card');
                setViewModalOpen(false);
              }}
            >
              🧾 Card
            </button>
          </div>
        </div>
      </Modal>

      {/* CRUD modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} width={600}>
        <CouponModal
          coupon={selected}
          onSave={handleSave}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </main>
  );
}

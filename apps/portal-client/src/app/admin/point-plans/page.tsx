// src/app/admin/point-plans/page.tsx
'use client';

import { useCallback, useEffect, useState, FormEvent, ChangeEvent } from 'react';
import {
  listAdminPointPlans,
  createPointPlan,
  patchPointPlan,
  deletePointPlan,
} from '@/services/pointPlanService';
import { listPointPurchases } from '@/services/pointPurchaseService';
import type {
  PointPlanRead,
  PaginatedPointPlans,
} from '@/types/pointPlan';
import type {
  PointPurchaseRead,
  PaginatedPointPurchases,
} from '@/types/pointPurchase';
import Notification from '@/components/Notification/Notification';
import Modal from '@/components/Modal/Modal';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import Button from '@/components/Button/Button';
import { PlusCircle } from 'lucide-react';
import styles from './page.module.css';

type ViewMode = 'table' | 'cards';
type NotificationState = { type: 'success' | 'error' | 'info'; message: string };

export default function AdminPointPlansPage() {
  // ────────────────────────────────────  PLANOS  ────────────────────────────────────
  const [plans, setPlans] = useState<PointPlanRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const [page, setPage] = useState(1);
  const limit = 10;
  const [total, setTotal] = useState(0);
  const lastPage = Math.ceil(total / limit);

  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [current, setCurrent] = useState<PointPlanRead | null>(null);

  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [recommended, setRecommended] = useState(false);
  const [price, setPrice] = useState<number>(0);
  const [points, setPoints] = useState<number>(0);

  // --- Memoized fetchPlans ---
  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      const res = await listAdminPointPlans(skip, limit);
      const data: PaginatedPointPlans = res.data;
      setPlans(data.items);
      setTotal(data.total);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro ao buscar planos';
      setNotification({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  function openCreate() {
    setMode('create'); setCurrent(null);
    setName(''); setSubtitle(''); setDescription('');
    setRecommended(false); setPrice(0); setPoints(0);
    setModalOpen(true);
  }

  function openEdit(plan: PointPlanRead) {
    setMode('edit'); setCurrent(plan);
    setName(plan.name); setSubtitle(plan.subtitle ?? '');
    setDescription(plan.description);
    setRecommended(plan.recommended);
    setPrice(plan.price); setPoints(plan.points);
    setModalOpen(true);
  }

  function closeModal() { setModalOpen(false); setCurrent(null); }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    try {
      if (mode === 'create') {
        await createPointPlan({ name, subtitle, description, recommended, price, points });
        setNotification({ type: 'success', message: 'Plano criado com sucesso!' });
      } else if (current) {
        await patchPointPlan(current.id, { name, subtitle, description, recommended, price });
        setNotification({ type: 'success', message: 'Plano atualizado com sucesso!' });
      }
      await fetchPlans();
      closeModal();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro ao salvar plano';
      setNotification({ type: 'error', message: msg });
    }
  }

  async function handleDelete() {
    if (!current) return;
    try {
      await deletePointPlan(current.id);
      setNotification({ type: 'success', message: 'Plano excluído com sucesso!' });
      await fetchPlans();
      closeModal();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro ao excluir plano';
      setNotification({ type: 'error', message: msg });
    }
  }

  // ───────────────────────────  COMPRAS DE PONTOS  ────────────────────────────
  const [purchases, setPurchases] = useState<PointPurchaseRead[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [purchasePage, setPurchasePage] = useState(1);
  const purchaseLimit = 10;
  const [purchaseTotal, setPurchaseTotal] = useState(0);
  const lastPurchasePage = Math.ceil(purchaseTotal / purchaseLimit);
  const [purchaseViewMode, setPurchaseViewMode] = useState<ViewMode>('table');

  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [currentPurchase, setCurrentPurchase] = useState<PointPurchaseRead | null>(null);

  // --- Memoized fetchPurchases ---
  const fetchPurchases = useCallback(async () => {
    setLoadingPurchases(true);
    try {
      const skip = (purchasePage - 1) * purchaseLimit;
      const res = await listPointPurchases(skip, purchaseLimit);
      const data: PaginatedPointPurchases = res.data;
      setPurchases(data.items);
      setPurchaseTotal(data.total);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro ao buscar compras';
      setNotification({ type: 'error', message: msg });
    } finally {
      setLoadingPurchases(false);
    }
  }, [purchasePage]);

  useEffect(() => { fetchPurchases(); }, [fetchPurchases]);

  function openPurchaseDetails(p: PointPurchaseRead) {
    setCurrentPurchase(p);
    setPurchaseModalOpen(true);
  }
  function closePurchaseModal() {
    setPurchaseModalOpen(false);
    setCurrentPurchase(null);
  }

  // util para badge
  const badgeClass = (status: string) => {
    switch (status) {
      case 'PAID':      return styles.badgePaid;
      case 'PENDING':   return styles.badgePending;
      case 'FAILED':    return styles.badgeFailed;
      case 'CANCELLED': return styles.badgeCancelled;
      default:          return '';
    }
  };

  /* ─────────────────────────── RENDER ─────────────────────────── */

  return (
    <div className={styles.container}>
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* ─── Planos ───────────────────────────────────────── */}
      <header className={styles.header}>
        <h1>Planos de Pontos</h1>
        <div className={styles.actionsHeader}>
          <button className={styles.btnPrimary} onClick={openCreate}>
            <PlusCircle size={16} /> Novo Plano
          </button>
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
        </div>
      </header>

      {loading ? (
        <p>Carregando planos...</p>
      ) : viewMode === 'table' ? (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Preço</th>
                <th>Pontos</th>
                <th>Recomendado</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {plans.map(plan => (
                <tr key={plan.id}>
                  <td data-label="Nome">{plan.name}</td>
                  <td data-label="Preço">R$ {plan.price.toFixed(2)}</td>
                  <td data-label="Pontos">{plan.points}</td>
                  <td data-label="Recomendado">{plan.recommended ? 'Sim' : 'Não'}</td>
                  <td data-label="Ações" className={styles.actions}>
                    <button className={styles.btnDetail} onClick={() => openEdit(plan)}>
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
          {plans.map(plan => (
            <div key={plan.id} className={styles.card}>
              <h2>{plan.name}</h2>
              <p>R$ {plan.price.toFixed(2)}</p>
              <p><strong>{plan.points} pontos</strong></p>
              {plan.recommended && (
                <span className={styles.badgeRecommended}>Recomendado</span>
              )}
              <button className={styles.btnDetail} onClick={() => openEdit(plan)}>
                Detalhes
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={styles.pagination}>
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
          ← Anterior
        </button>
        <span>{page} / {lastPage}</span>
        <button onClick={() => setPage(p => Math.min(lastPage, p + 1))} disabled={page === lastPage}>
          Próxima →
        </button>
      </div>

      {/* Modal criar/editar plano */}
      <Modal open={modalOpen} onClose={closeModal} width={600}>
        <div className={styles.detail}>
          <h2>{mode === 'create' ? 'Novo Plano' : 'Editar Plano'}</h2>
          <form className={styles.form} onSubmit={handleSave}>
            <FloatingLabelInput
              id="plan-name"
              label="Nome"
              value={name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              required
            />
            <FloatingLabelInput
              id="plan-subtitle"
              label="Subtítulo"
              value={subtitle}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSubtitle(e.target.value)}
            />
            <FloatingLabelInput
              id="plan-description"
              label="Descrição"
              value={description}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
              required
            />
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={recommended}
                onChange={e => setRecommended(e.target.checked)}
              />
              Recomendado
            </label>
            <FloatingLabelInput
              id="plan-price"
              label="Preço"
              type="number"
              step="0.01"
              value={price}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPrice(parseFloat(e.target.value))}
              required
            />
            <FloatingLabelInput
              id="plan-points"
              label="Pontos"
              type="number"
              value={points}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPoints(parseInt(e.target.value, 10))}
              required
            />
            <div className={styles.formActions}>
              {mode === 'edit' && (
                <Button bgColor="#ef4444" onClick={handleDelete} type="button">
                  Excluir
                </Button>
              )}
              <Button bgColor="#3b82f6" type="submit">
                Salvar
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ─── Compras de Pontos ────────────────────────────────────────────── */}
      <section className={styles.purchasesSection}>
        <div className={styles.header}>
          <h2>Compras de Pontos</h2>
          <div className={styles.viewToggle}>
            <button
              className={purchaseViewMode === 'table' ? styles.activeToggle : ''}
              onClick={() => setPurchaseViewMode('table')}
            >
              Tabela
            </button>
            <button
              className={purchaseViewMode === 'cards' ? styles.activeToggle : ''}
              onClick={() => setPurchaseViewMode('cards')}
            >
              Cards
            </button>
          </div>
        </div>

        {loadingPurchases ? (
          <p>Carregando compras...</p>
        ) : purchaseViewMode === 'table' ? (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Plano</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Criado em</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map(p => (
                  <tr key={p.id}>
                    <td data-label="ID">{p.id.slice(0, 8)}…</td>
                    <td data-label="Plano">{p.plan?.name ?? '-'}</td>
                    <td data-label="Valor">R$ {p.amount.toFixed(2)}</td>
                    <td data-label="Status">
                      <span className={badgeClass(p.status)}>{p.status}</span>
                    </td>
                    <td data-label="Criado em">
                      {new Date(p.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td data-label="Ações" className={styles.actions}>
                      <button
                        className={styles.btnDetail}
                        onClick={() => openPurchaseDetails(p)}
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
            {purchases.map(p => (
              <div key={p.id} className={styles.card}>
                <div className={styles.cardBody}>
                  <h3>{p.plan?.name ?? '—'}</h3>
                  <p><strong>R$ {p.amount.toFixed(2)}</strong></p>
                  <p><span className={badgeClass(p.status)}>{p.status}</span></p>
                  <p className={styles.subText}>
                    {new Date(p.created_at).toLocaleDateString('pt-BR')}
                  </p>
                  <button
                    className={styles.btnDetail}
                    onClick={() => openPurchaseDetails(p)}
                  >
                    Detalhes
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.pagination}>
          <button
            onClick={() => setPurchasePage(p => Math.max(1, p - 1))}
            disabled={purchasePage === 1}
          >
            ← Anterior
          </button>
          <span>{purchasePage} / {lastPurchasePage}</span>
          <button
            onClick={() => setPurchasePage(p => Math.min(lastPurchasePage, p + 1))}
            disabled={purchasePage === lastPurchasePage}
          >
            Próxima →
          </button>
        </div>
      </section>

      {/* Modal de Detalhes de Compra */}
      <Modal open={purchaseModalOpen} onClose={closePurchaseModal} width={600}>
        {currentPurchase && (
          <div className={styles.detail}>
            <h2>Compra: {currentPurchase.asaas_id}</h2>

            <section>
              <h3>Plano</h3>
              <p><strong>Nome:</strong> {currentPurchase.plan?.name ?? '-'}</p>
              <p><strong>Pontos:</strong> {currentPurchase.plan?.points}</p>
              <p><strong>Valor:</strong> R$ {currentPurchase.amount.toFixed(2)}</p>
            </section>

            <section>
              <h3>Detalhes da Compra</h3>
              {currentPurchase.pix_copy_paste_code && (
                <p>
                  <strong>Código PIX:</strong>{' '}
                  <code>{currentPurchase.pix_copy_paste_code}</code>
                </p>
              )}
              {currentPurchase.pix_expires_at && (
                <p>
                  <strong>Validade PIX:</strong>{' '}
                  {new Date(currentPurchase.pix_expires_at).toLocaleString('pt-BR')}
                </p>
              )}
              <p>
                <strong>Status:</strong>{' '}
                <span className={badgeClass(currentPurchase.status)}>
                  {currentPurchase.status}
                </span>
              </p>
              <p>
                <strong>Criado em:</strong>{' '}
                {new Date(currentPurchase.created_at).toLocaleString('pt-BR')}
              </p>
              <p>
                <strong>Atualizado em:</strong>{' '}
                {new Date(currentPurchase.updated_at).toLocaleDateString('pt-BR')}
              </p>
            </section>

            <section>
              <h3>Empresa</h3>
              <p><strong>ID:</strong> {currentPurchase.company?.id ?? '-'}</p>
              <p><strong>Nome:</strong> {currentPurchase.company?.name}</p>
              <p><strong>Email:</strong> {currentPurchase.company?.email}</p>
              <p><strong>Telefone:</strong> {currentPurchase.company?.phone}</p>
              <p><strong>CNPJ:</strong> {currentPurchase.company?.cnpj}</p>
            </section>
          </div>
        )}
      </Modal>
    </div>
  );
}

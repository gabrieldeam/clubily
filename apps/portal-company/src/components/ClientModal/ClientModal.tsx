// src/components/ClientModal/ClientModal.tsx
'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { preRegister, checkPreRegistered } from '@/services/userService';
import { getCashbackPrograms } from '@/services/cashbackProgramService';
import { getUserWallet, withdrawUserWallet } from '@/services/walletService';
import { listInventoryItems, searchInventoryItems } from '@/services/inventoryItemService';
import { listBranches } from '@/services/branchService';
import { checkout } from '@/services/checkoutService';
import { previewCoupon } from '@/services/couponService';

import type { BranchRead } from '@/types/branch';
import type { LeadCreate, UserRead } from '@/types/user';
import type { CashbackProgramRead } from '@/types/cashbackProgram';
import type { UserWalletRead } from '@/types/wallet';
import type { InventoryItemRead } from '@/types/inventoryItem';

import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import Notification from '@/components/Notification/Notification';
import Button from '@/components/Button/Button';
import styles from './ClientModal.module.css';

interface ClientModalProps {
  onClose: () => void;
}

export default function ClientModal({ onClose }: ClientModalProps) {
  const router = useRouter();
  const { user: company } = useAuth();
  const companyId = company?.id ?? '';
  const { refresh: refreshCompanyWallet } = useWallet();

  /* ---------- pré-cadastro ---------- */
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<
    | { type: 'info' | 'success' | 'error'; message: string }
    | null
  >(null);
  const [client, setClient] = useState<UserRead | null>(null);

  /* ---------- programas de cashback ---------- */
  const [programs, setPrograms] = useState<CashbackProgramRead[]>([]);
  const [progLoading, setProgLoading] = useState(false);

  /* ---------- inventário ---------- */
  const [items, setItems] = useState<InventoryItemRead[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  // Busca + paginação
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const perPage = 10;

  /* ---------- carteira ---------- */
  const [userWallet, setUserWallet] = useState<UserWalletRead | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  /* ---------- compra ---------- */
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({});
  const [selectedIndex, setSelectedIndex] = useState<Record<string, number>>({});
  const [branchId, setBranchId] = useState('');
  const [eventValue, setEventValue] = useState('');
  const [associateCb, setAssociateCb] = useState(false);
  const [selectedProg, setSelectedProg] = useState<string>('');
  const [stampCode, setStampCode] = useState('');

  // Cupom
  const [couponCode, setCouponCode] = useState('');
  const [couponPreview, setCouponPreview] = useState<{
    valid: boolean;
    discount: number;
    final_amount?: number | null;
    reason?: string | null;
  } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const [purchaseNotification, setPurchaseNotification] = useState<
    | { type: 'success' | 'error'; message: string }
    | null
  >(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  /* ---------- filiais ---------- */
  const [branches, setBranches] = useState<BranchRead[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);

  /* ----------------------------- reset modal ---------------------------- */
  const handleReset = () => {
    setPhone('');
    setCpf('');
    setClient(null);
    setNotification(null);

    /* programas */
    setPrograms([]);
    setProgLoading(false);
    setSelectedProg('');

    /* inventário */
    setItems([]);
    setSelectedItems([]);
    setItemCounts({});
    setSelectedIndex({});

    /* compra */
    setPurchaseAmount('');
    setStampCode('');
    setBranchId('');
    setEventValue('');
    setAssociateCb(false);
    setPurchaseNotification(null);
    setPurchaseLoading(false);

    /* cupom */
    setCouponCode('');
    setCouponPreview(null);
    setValidatingCoupon(false);

    /* carteira */
    setUserWallet(null);
    setWalletLoading(false);
    setWithdrawAmount('');
    setWithdrawError(null);
    setWithdrawLoading(false);
  };

  // +1 no contador e marca item
  const incrementItem = (id: string) => {
    setItemCounts(prev => {
      const next = { ...prev, [id]: (prev[id] || 0) + 1 };
      setSelectedItems(s => (s.includes(id) ? s : [...s, id]));
      const price = items.find(i => i.id === id)?.price;
      setSelectedIndex(prevIdx =>
        prevIdx[id] === undefined ? { ...prevIdx, [id]: Number(price ?? 0) } : prevIdx
      );
      return next;
    });
  };

  // –1 no contador e desmarca quando zera
  const decrementItem = (id: string) => {
    setItemCounts(prev => {
      const current = prev[id] || 0;
      const nextCount = current - 1;
      const next = { ...prev };

      if (nextCount <= 0) {
        delete next[id];
        setSelectedItems(s => s.filter(x => x !== id));
        setSelectedIndex(prevIndex => {
          const nextIndex = { ...prevIndex };
          delete nextIndex[id];
          return nextIndex;
        });
      } else {
        next[id] = nextCount;
      }
      return next;
    });
  };

  /* -------------------- 1) pré-cadastro do cliente --------------------- */
  const handlePre = async (e: FormEvent) => {
    e.preventDefault();
    setNotification(null);

    if (!companyId) {
      setNotification({ type: 'error', message: 'Empresa não autenticada.' });
      return;
    }

    const rawPhone = phone.replace(/\D/g, '');
    const rawCpf = cpf.replace(/\D/g, '');

    if (!rawPhone && !rawCpf) {
      setNotification({ type: 'error', message: 'Informe Telefone ou CPF.' });
      return;
    }

    setLoading(true);
    const params: LeadCreate = {
      company_id: companyId,
      phone: rawPhone || undefined,
      cpf: rawCpf || undefined,
    };

    try {
      const res = await checkPreRegistered(params);
      setClient(res.data);
      setNotification({ type: 'info', message: 'Cliente pré-registrado encontrado.' });
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 404) {
        const res = await preRegister(params);
        setClient(res.data);
        setNotification({ type: 'success', message: 'Cliente pré-registrado com sucesso!' });
      } else {
        const detail = isAxiosError(err) ? err.response?.data?.detail : undefined;
        setNotification({ type: 'error', message: detail || 'Erro no pré-cadastro.' });
      }
    } finally {
      setLoading(false);
    }
  };

  /* --- 2) carrega programas, inventário, carteira, filiais quando tem cliente --- */
  useEffect(() => {
    if (!client) return;

    /* programas */
    setProgLoading(true);
    getCashbackPrograms()
      .then(r => setPrograms(r.data))
      .catch(console.error)
      .finally(() => setProgLoading(false));

    /* inventário */
    setItemsLoading(true);
    const promise = searchTerm
      ? searchInventoryItems(searchTerm, page * perPage, perPage)
      : listInventoryItems(page * perPage, perPage);

    promise
      .then(({ data }) => {
        setItems(data.items);
        setTotalPages(Math.ceil(data.total / perPage));
      })
      .catch(console.error)
      .finally(() => setItemsLoading(false));

    /* carteira */
    setWalletLoading(true);
    getUserWallet(client.id)
      .then(r => setUserWallet(r.data))
      .catch(console.error)
      .finally(() => setWalletLoading(false));

    /* filiais */
    setBranchesLoading(true);
    listBranches()
      .then(r => setBranches(r.data))
      .catch(console.error)
      .finally(() => setBranchesLoading(false));
  }, [client, page, searchTerm]);

  // Seleciona programa automaticamente se houver apenas um
  useEffect(() => {
    if (programs.length === 1) setSelectedProg(programs[0].id);
  }, [programs]);

  // Recalcula total (quantidade × preço)
  useEffect(() => {
    const sum = Object.entries(itemCounts).reduce((total, [id, count]) => {
      const priceInPage = items.find(i => i.id === id)?.price;
      const price = Number(priceInPage ?? selectedIndex[id] ?? 0);
      return total + price * (count ?? 0);
    }, 0);
    setPurchaseAmount(sum.toFixed(2));
  }, [itemCounts, items, selectedIndex]);

  /* ---------------------- Pré-visualizar cupom ------------------------ */
  const handlePreviewCoupon = async () => {
    setCouponPreview(null);
    if (!client?.id) return;

    const code = couponCode.trim();
    if (!code) return;

    const amount = parseFloat(purchaseAmount.replace(',', '.')) || 0;
    const uniqueSelectedItems = Array.from(new Set(selectedItems));

    setValidatingCoupon(true);
    try {
      const { data } = await previewCoupon({
        code,
        user_id: client.id,
        amount,
        item_ids: uniqueSelectedItems.length ? uniqueSelectedItems : undefined,
        // se quiser, passe lat/lng do PDV/branch
      });
      setCouponPreview({
        valid: data.valid,
        discount: data.discount || 0,
        final_amount: data.final_amount,
        reason: data.reason,
      });
    } catch {
      setCouponPreview({ valid: false, discount: 0, reason: 'Erro ao validar cupom.' });
    } finally {
      setValidatingCoupon(false);
    }
  };

  /* -------------------- 4) registrar compra (checkout) -------------------- */
  const handleRegisterPurchase = async () => {
    setPurchaseNotification(null);
    if (!client?.id) return;

    const amount = parseFloat(purchaseAmount.replace(',', '.'));
    if (isNaN(amount) || amount < 0) {
      setPurchaseNotification({ type: 'error', message: 'Informe um valor de compra válido (não negativo).' });
      return;
    }

    // Se marcar cashback e houver vários programas, exigir seleção
    if (associateCb && programs.length > 1 && !selectedProg) {
      setPurchaseNotification({ type: 'error', message: 'Selecione o programa de cashback.' });
      return;
    }

    const uniqueSelectedItems = Array.from(new Set(selectedItems));
    setPurchaseLoading(true);

    try {
      const { data } = await checkout({
        user_id: client.id,
        amount,
        item_ids: uniqueSelectedItems.length ? uniqueSelectedItems : undefined,
        branch_id: branchId || undefined,
        event: eventValue || undefined,
        coupon_code: couponCode.trim() || undefined,
        // se quiser, envie source_lat/source_lng/source_location_name
        associate_cashback: associateCb,
        program_id: associateCb ? (programs.length === 1 ? programs[0].id : selectedProg || undefined) : undefined,
        stamp_code: stampCode.trim() || undefined,
      });

      // Atualiza carteira
      setWalletLoading(true);
      getUserWallet(client.id)
        .then(r => setUserWallet(r.data))
        .catch(console.error)
        .finally(() => setWalletLoading(false));

      refreshCompanyWallet();

      setPurchaseNotification({
        type: 'success',
        message: `Compra registrada! Desconto R$ ${data.discount.toFixed(2)} — Total final R$ ${data.final_amount.toFixed(2)}.`,
      });

      // Limpa campos
      setPurchaseAmount('');
      setStampCode('');
      setSelectedItems([]);
      setItemCounts({});
      setSelectedIndex({});
      setBranchId('');
      setEventValue('');
      setAssociateCb(false);
      setCouponCode('');
      setCouponPreview(null);
    } catch (err) {
      const detail = isAxiosError(err) ? err.response?.data?.detail : (err as Error).message;
      setPurchaseNotification({ type: 'error', message: detail || 'Erro ao registrar compra.' });
    } finally {
      setPurchaseLoading(false);
    }
  };

  /* ----------------------- 5) debitar carteira ------------------------ */
  const handleWithdraw = async () => {
    if (!client) return;

    const value = parseFloat(withdrawAmount.replace(',', '.'));
    if (isNaN(value) || value <= 0) {
      setWithdrawError('Informe um valor válido.');
      return;
    }

    setWithdrawLoading(true);
    setWithdrawError(null);

    try {
      const res = await withdrawUserWallet(client.id, { amount: value });
      setUserWallet(res.data);
      setWithdrawAmount('');
      refreshCompanyWallet();
    } catch (err) {
      const detail = isAxiosError(err) ? err.response?.data?.detail : undefined;
      setWithdrawError(detail || 'Erro ao debitar carteira.');
    } finally {
      setWithdrawLoading(false);
    }
  };

  /* -------------------------------- UI -------------------------------- */

  // formulário de pré-cadastro
  if (!client) {
    return (
      <form className={styles.form} onSubmit={handlePre}>
        <h2 className={styles.title}>Pré-cadastrar Cliente</h2>

        {notification && (
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}

        <FloatingLabelInput
          id="client-phone"
          name="phone"
          label="Telefone"
          type="text"
          value={phone}
          onChange={e => setPhone(e.target.value)}
        />

        <div className={styles.separator}>e/ou</div>

        <FloatingLabelInput
          id="client-cpf"
          name="cpf"
          label="CPF"
          type="text"
          value={cpf}
          onChange={e => setCpf(e.target.value)}
        />

        <div className={styles.actions}>
          <Button type="submit" disabled={loading}>
            {loading ? 'Processando…' : 'OK'}
          </Button>
          <Button bgColor="#AAA" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    );
  }

  // visão do cliente
  return (
    <div className={styles.form}>
      <h2 className={styles.title}>Visão do Cliente</h2>

      {/* informações básicas */}
      <div className={styles.userInfo}>
        <p><strong>Nome:</strong> {client.name || '—'}</p>
        <p><strong>Telefone:</strong> {client.phone || '—'}</p>
        <p><strong>CPF:</strong> {client.cpf || '—'}</p>
      </div>

      {/* registro de compra */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Registrar Compra</h3>

        <FloatingLabelInput
          id="purchase-amount"
          name="purchaseAmount"
          label="Valor da compra (R$)"
          type="number"
          value={purchaseAmount}
          readOnly
        />

        {/* CUPOM */}
        <div className={styles.couponRow}>
          <FloatingLabelInput
            id="coupon-code"
            name="couponCode"
            label="Cupom (opcional)"
            type="text"
            value={couponCode}
            onChange={e => setCouponCode(e.target.value)}
          />
          <Button onClick={handlePreviewCoupon} disabled={validatingCoupon || !couponCode.trim()}>
            {validatingCoupon ? 'Validando…' : 'Validar Cupom'}
          </Button>
        </div>
        {couponPreview && (
          <div className={styles.couponPreview}>
            {couponPreview.valid ? (
              <>
                <p>Desconto: <strong>R$ {couponPreview.discount.toFixed(2)}</strong></p>
                <p>Total com cupom: <strong>R$ {(couponPreview.final_amount ?? Math.max(0, parseFloat(purchaseAmount || '0') - (couponPreview.discount || 0))).toFixed(2)}</strong></p>
              </>
            ) : (
              <p style={{ color: 'red' }}>{couponPreview.reason || 'Cupom inválido.'}</p>
            )}
          </div>
        )}

        {/* inventário */}
        {itemsLoading ? (
          <p>Carregando itens…</p>
        ) : items.length > 0 ? (
          <div>
            <label className={styles.label}>Itens comprados (Opcional)</label>
            <div className={styles.checkboxList}>
              <input
                type="text"
                placeholder="Buscar por nome ou SKU…"
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setPage(0);
                }}
                className={styles.searchInput}
              />

              {items.map(item => {
                const count = itemCounts[item.id] || 0;
                const checked = (itemCounts[item.id] ?? 0) > 0;

                return (
                  <div key={item.id} className={styles.itemRow}>
                    <label className={`${styles.itemLabel} ${checked ? styles.itemLabelChecked : ''}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          if (checked) {
                            setItemCounts(prev => {
                              const next = { ...prev };
                              delete next[item.id];
                              return next;
                            });
                            setSelectedItems(s => s.filter(x => x !== item.id));
                            setSelectedIndex(prevIndex => {
                              const nextIndex = { ...prevIndex };
                              delete nextIndex[item.id];
                              return nextIndex;
                            });
                          } else {
                            setItemCounts(prev => ({ ...prev, [item.id]: 1 }));
                            setSelectedItems(s => (s.includes(item.id) ? s : [...s, item.id]));
                            setSelectedIndex(prev => (prev[item.id] === undefined ? { ...prev, [item.id]: Number(item.price) } : prev));
                          }
                        }}
                      />
                      {item.name}
                    </label>

                    <div className={styles.qtyControls}>
                      <button type="button" onClick={() => decrementItem(item.id)} disabled={count === 0}>–</button>
                      <span>{count}</span>
                      <button type="button" onClick={() => incrementItem(item.id)}>+</button>
                    </div>
                  </div>
                );
              })}

              {/* paginação */}
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button onClick={() => setPage(p => Math.max(p - 1, 0))} disabled={page === 0}>Anterior</button>
                  <span>{page + 1} / {totalPages || 1}</span>
                  <button onClick={() => setPage(p => Math.min(p + 1, totalPages - 1))} disabled={page + 1 >= totalPages}>Próxima</button>
                </div>
              )}
            </div>

            {selectedItems.length > 0 && (
              <p className={styles.selectedHint}>
                Selecionados:&nbsp;
                {Array.from(new Set(selectedItems))
                  .map(id => {
                    const it = items.find(i => i.id === id);
                    const qty = itemCounts[id] ?? 0;
                    return it ? `${it.name} × ${qty}` : `${id} × ${qty}`;
                  })
                  .filter(Boolean)
                  .join(', ')}
              </p>
            )}
          </div>
        ) : (
          <div className={styles.noInventory}>
            <p>Nenhum item de inventário encontrado.</p>
            <Button onClick={() => router.push('/register?section=inventory')}>Cadastrar Inventário</Button>
          </div>
        )}

        {/* seletor de filial */}
        {branchesLoading ? (
          <p>Carregando filiais…</p>
        ) : branches.length > 0 ? (
          <select className={styles.select} value={branchId} onChange={e => setBranchId(e.target.value)}>
            <option value="">Selecione a filial (Opcional)</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        ) : null}

        {/* checkbox de cashback */}
        {programs.length > 0 && (
          <div className={styles.checkboxRow}>
            <input
              id="associate-cb"
              type="checkbox"
              checked={associateCb}
              onChange={e => setAssociateCb(e.target.checked)}
            />
            <label htmlFor="associate-cb">Associar Cashback</label>
          </div>
        )}

        {/* seletor de programa */}
        {associateCb && programs.length > 1 && (
          <>
            <label className={styles.label}>Programa</label>
            <select
              className={styles.select}
              value={selectedProg}
              onChange={e => setSelectedProg(e.target.value)}
            >
              <option value="">— selecione —</option>
              {programs.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.percent}%)
                </option>
              ))}
            </select>
          </>
        )}

        <FloatingLabelInput
          id="stamp-code"
          name="stampCode"
          label="Código do cartão (opcional)"
          type="text"
          value={stampCode}
          onChange={e => setStampCode(e.target.value)}
        />

        {progLoading && <p>Carregando programas…</p>}

        <div>
          <Button onClick={handleRegisterPurchase} disabled={purchaseLoading}>
            {purchaseLoading ? 'Processando…' : 'Registrar Compra'}
          </Button>
        </div>

        {purchaseNotification && (
          <Notification
            type={purchaseNotification.type}
            message={purchaseNotification.message}
            onClose={() => setPurchaseNotification(null)}
          />
        )}
      </div>

      {/* carteira */}
      <div className={styles.walletCard}>
        <h3 className={styles.sectionTitle}>Carteira</h3>
        {walletLoading ? (
          <p>Carregando saldo…</p>
        ) : userWallet ? (
          <>
            <div className={styles.balanceRow}>
              <span>Saldo Atual:</span>
              <strong>R$ {Number(userWallet.balance).toFixed(2)}</strong>
            </div>

            <div className={styles.balanceRow}>
              <FloatingLabelInput
                id="withdraw-amount"
                name="withdrawAmount"
                label="Valor a debitar"
                type="number"
                value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
                disabled={withdrawLoading}
              />

              <div className={styles.actions}>
                <Button onClick={handleWithdraw} disabled={withdrawLoading}>
                  {withdrawLoading ? 'Processando…' : 'Debitar'}
                </Button>
              </div>
            </div>

            {withdrawError && (
              <Notification
                type="error"
                message={withdrawError}
                onClose={() => setWithdrawError(null)}
              />
            )}
          </>
        ) : null}
      </div>

      <div className={styles.actions}>
        <Button bgColor="#AAA" onClick={handleReset}>
          Outro cadastro
        </Button>
      </div>
    </div>
  );
}

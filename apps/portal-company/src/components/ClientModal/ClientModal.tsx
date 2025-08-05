// src/components/ClientModal/ClientModal.tsx
'use client';

/* ------------------------------- imports ------------------------------- */
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import {
  preRegister,
  checkPreRegistered,
} from '@/services/userService';
import { getCashbackPrograms } from '@/services/cashbackProgramService';
import { assignCashback } from '@/services/cashbackService';
import { getUserWallet, withdrawUserWallet } from '@/services/walletService';
import { evaluatePurchase } from '@/services/purchaseService';
import { listInventoryItems, searchInventoryItems } from '@/services/inventoryItemService';
import { listBranches } from '@/services/branchService';
import { adminStampCard } from '@/services/loyaltyService';  
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

/* ============================== component ============================== */
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

  // Para busca + paginação
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
  const [purchaseNotification, setPurchaseNotification] = useState<
    | { type: 'success' | 'error'; message: string }
    | null
  >(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  /* ---------- filiais ---------- */
  const [branches, setBranches] = useState<BranchRead[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);



  /* -------------------------------------------------------------------- */
  /*                              reset modal                             */
  /* -------------------------------------------------------------------- */
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

    /* carteira */
    setUserWallet(null);
    setWalletLoading(false);
    setWithdrawAmount('');
    setWithdrawError(null);
    setWithdrawLoading(false);
  };



  // +1 no contador (e garante que o item fique marcado)
const incrementItem = (id: string) => {
  setItemCounts(prev => {
    const next = { ...prev, [id]: (prev[id] || 0) + 1 };

    // adiciona o id apenas se ainda não existir
    setSelectedItems(s => (s.includes(id) ? s : [...s, id]));

    // salva o preço se ainda não existir no índice
    const price = items.find(i => i.id === id)?.price;
    setSelectedIndex(prevIdx =>
      prevIdx[id] === undefined ? { ...prevIdx, [id]: Number(price ?? 0) } : prevIdx
    );

    return next;
  });
};



  // –1 no contador (e, se chegar a 0, desmarca e remove do selectedItems)
const decrementItem = (id: string) => {
  setItemCounts(prev => {
    const current = prev[id] || 0;
    const nextCount = current - 1;
    const next = { ...prev };

    if (nextCount <= 0) {
      delete next[id];
      setSelectedItems(s => s.filter(x => x !== id));
      // TAMBÉM remove do índice de preços
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




  /* -------------------------------------------------------------------- */
  /*                      1) pré-cadastro do cliente                       */
  /* -------------------------------------------------------------------- */
  const handlePre = async (e: FormEvent) => {
    e.preventDefault();
    setNotification(null);

    if (!companyId) {
      setNotification({
        type: 'error',
        message: 'Empresa não autenticada.',
      });
      return;
    }

    const rawPhone = phone.replace(/\D/g, '');
    const rawCpf = cpf.replace(/\D/g, '');

    if (!rawPhone && !rawCpf) {
      setNotification({
        type: 'error',
        message: 'Informe Telefone ou CPF.',
      });
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
      setNotification({
        type: 'info',
        message: 'Cliente pré-registrado encontrado.',
      });
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 404) {
        const res = await preRegister(params);
        setClient(res.data);
        setNotification({
          type: 'success',
          message: 'Cliente pré-registrado com sucesso!',
        });
      } else {
        const detail = isAxiosError(err)
          ? err.response?.data?.detail
          : undefined;
        setNotification({
          type: 'error',
          message: detail || 'Erro no pré-cadastro.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------------------------- */
  /*        2) carrega programas, inventário, carteira, filiais            */
  /* -------------------------------------------------------------------- */
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
    .catch(err => {
      console.error(err);
      // opcional: setNotification({ type: 'error', message: 'Erro ao carregar itens.' })
    })
    .finally(() => {
      setItemsLoading(false);
    });

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



  /* 3) seleciona programa automaticamente se houver apenas um */
  useEffect(() => {
    if (programs.length === 1) {
      setSelectedProg(programs[0].id);
    }
  }, [programs]);

  /* recalcula total da compra (quantidade × preço), mesmo com paginação */
  useEffect(() => {
    const sum = Object.entries(itemCounts).reduce((total, [id, count]) => {
      const priceInPage = items.find(i => i.id === id)?.price;
      const price = Number(priceInPage ?? selectedIndex[id] ?? 0);
      return total + price * (count ?? 0);
    }, 0);

    setPurchaseAmount(sum.toFixed(2));
  }, [itemCounts, items, selectedIndex]);


  /* -------------------------------------------------------------------- */
  /*                      4) registrar compra do cliente                  */
  /* -------------------------------------------------------------------- */
  const handleRegisterPurchase = async () => {
    setPurchaseNotification(null);

    if (!client?.id) return;

    const amount = parseFloat(purchaseAmount.replace(',', '.'));
    if (isNaN(amount) || amount < 0) {
      setPurchaseNotification({
        type: 'error',
        message: 'Informe um valor de compra válido (não negativo).',
      });
      return;
    }

    const uniqueSelectedItems = Array.from(new Set(selectedItems));

    setPurchaseLoading(true);

    try {
      /* 4a) avalia regras internas */
      await evaluatePurchase({
        user_id: client.id,
        amount,
        purchased_items: uniqueSelectedItems.length ? uniqueSelectedItems : undefined,
        branch_id: branchId || undefined,
        event: eventValue || undefined,
      });


      /* 4b) cashback opcional */
      if (associateCb) {
        const programId = programs.length === 1 ? programs[0].id : selectedProg;
        if (!programId) {
          throw new Error('Programa de cashback não selecionado.');
        }
        await assignCashback(client.id, {
          program_id: programId,
          amount_spent: amount,
        });
      }

      /* 4c) carimbo opcional */
      const trimmedCode = stampCode.trim();
      if (trimmedCode) {
        await adminStampCard({
          code: trimmedCode,
          amount,
          purchased_items: uniqueSelectedItems.length ? uniqueSelectedItems : undefined,
          visit_count: 1,
        });
      }

      /* atualiza carteira */
      setWalletLoading(true);
      getUserWallet(client.id)
        .then(r => setUserWallet(r.data))
        .catch(console.error)
        .finally(() => setWalletLoading(false));

      refreshCompanyWallet();

      setPurchaseNotification({
        type: 'success',
        message: 'Compra registrada com sucesso!',
      });

      /* limpa campos */
      setPurchaseAmount('');
      setStampCode('');
      setSelectedItems([]);
      setItemCounts({});          // << ADICIONE
      setSelectedIndex({});       // << ADICIONE
      setBranchId('');
      setEventValue('');
      setAssociateCb(false);
    } catch (err) {
      const detail = isAxiosError(err)
        ? err.response?.data?.detail
        : (err as Error).message;
      setPurchaseNotification({
        type: 'error',
        message: detail || 'Erro ao registrar compra.',
      });
    } finally {
      setPurchaseLoading(false);
    }
  };

  /* -------------------------------------------------------------------- */
  /*                     5) debita carteira do cliente                     */
  /* -------------------------------------------------------------------- */
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
      const detail = isAxiosError(err)
        ? err.response?.data?.detail
        : undefined;
      setWithdrawError(detail || 'Erro ao debitar carteira.');
    } finally {
      setWithdrawLoading(false);
    }
  };

  /* -------------------------------------------------------------------- */
  /*                               RENDER                                 */
  /* -------------------------------------------------------------------- */

  /* ---------- formulário de pré-cadastro ---------- */
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

  /* ---------- visão do cliente ---------- */
  return (
    <div className={styles.form}>
      <h2 className={styles.title}>Visão do Cliente</h2>

      {/* informações básicas */}
      <div className={styles.userInfo}>
        <p>
          <strong>Nome:</strong> {client.name || '—'}
        </p>
        <p>
          <strong>Telefone:</strong> {client.phone || '—'}
        </p>
        <p>
          <strong>CPF:</strong> {client.cpf || '—'}
        </p>
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

        {/* inventário */}
        {itemsLoading ? (
          <p>Carregando itens…</p>
        ) : items.length > 0 ? (
          <div>
            <label className={styles.label}>
              Itens comprados (Opcional)
            </label>
            <div className={styles.checkboxList}>
              <input
                type="text"
                placeholder="Buscar por nome ou SKU…"
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setPage(0); // volta à página 0 ao novo filtro
                }}
                className={styles.searchInput}
              />

              {items.map(item => {
                const count = itemCounts[item.id] || 0;
                const checked = (itemCounts[item.id] ?? 0) > 0;

                return (
                  <div key={item.id} className={styles.itemRow}>
                    <label 
                      className={`${styles.itemLabel} ${
                        checked ? styles.itemLabelChecked : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          if (checked) {
                            // uncheck → zera contador, remove seleção e limpa índice de preços
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
                            // check → inicia em 1, adiciona à seleção e salva o preço atual no índice
                            setItemCounts(prev => ({ ...prev, [item.id]: 1 }));
                            setSelectedItems(s => (s.includes(item.id) ? s : [...s, item.id]));
                            setSelectedIndex(prev => (
                              prev[item.id] === undefined ? { ...prev, [item.id]: Number(item.price) } : prev
                            ));

                          }
                        }}

                      />
                      {item.name}
                    </label>

                    {/* CONTROLES + / – */}
                    <div className={styles.qtyControls}>
                      <button
                        type="button"
                        onClick={() => decrementItem(item.id)}
                        disabled={count === 0}
                      >
                        –
                      </button>
                      <span>{count}</span>
                      <button type="button" onClick={() => incrementItem(item.id)}>
                        +
                      </button>
                    </div>
                  </div>
                );
              })}


              {/* paginação dos itens */}
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button onClick={() => setPage(p => Math.max(p - 1, 0))} disabled={page === 0}>
                    Anterior
                  </button>
                  <span>{page + 1} / {totalPages || 1}</span>
                  <button onClick={() => setPage(p => Math.min(p + 1, totalPages - 1))} disabled={page + 1 >= totalPages}>
                    Próxima
                  </button>
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
            <Button
              onClick={() => router.push('/register?section=inventory')}
            >
              Cadastrar Inventário
            </Button>
          </div>
        )}

        {/* seletor de filial */}
        {branchesLoading ? (
          <p>Carregando filiais…</p>
        ) : branches.length > 0 ? (
          <select
            className={styles.select}
            value={branchId}
            onChange={e => setBranchId(e.target.value)}
          >
            <option value="">Selecione a filial (Opcional)</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
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

        {/* loading de programas */}
        {progLoading && <p>Carregando programas…</p>}

        <div>
          <Button
            onClick={handleRegisterPurchase}
            disabled={purchaseLoading}
          >
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
                <Button
                  onClick={handleWithdraw}
                  disabled={withdrawLoading}
                >
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

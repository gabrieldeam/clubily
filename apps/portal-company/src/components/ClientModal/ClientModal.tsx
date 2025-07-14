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
import { listInventoryItems } from '@/services/inventoryItemService';
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

  /* paginação inventário */
  const [itemTotal, setItemTotal] = useState(0);
  const [itemSkip, setItemSkip] = useState(0);
  const itemLimit = 10;

  /* ---------- carteira ---------- */
  const [userWallet, setUserWallet] = useState<UserWalletRead | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  /* ---------- compra ---------- */
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
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
    setItemsLoading(false);
    setSelectedItems([]);

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
    listInventoryItems(itemSkip, itemLimit)
      .then(({ data }) => {
        setItems(data.items);
        setItemTotal(data.total);
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
  }, [client, itemSkip]);

  /* 3) seleciona programa automaticamente se houver apenas um */
  useEffect(() => {
    if (programs.length === 1) {
      setSelectedProg(programs[0].id);
    }
  }, [programs]);

  /* recalcula total da compra quando itens mudam */
  useEffect(() => {
    const sum = selectedItems.reduce((total, itemId) => {
      const item = items.find(i => i.id === itemId);
      const price =
        item?.price != null
          ? typeof item.price === 'string'
            ? parseFloat(item.price)
            : item.price
          : 0;
      return total + price;
    }, 0);

    setPurchaseAmount(sum.toFixed(2));
  }, [selectedItems, items]);

  /* -------------------------------------------------------------------- */
  /*                      4) registrar compra do cliente                  */
  /* -------------------------------------------------------------------- */
  const handleRegisterPurchase = async () => {
    setPurchaseNotification(null);

    if (!client?.id) return;

    const amount = parseFloat(purchaseAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      setPurchaseNotification({
        type: 'error',
        message: 'Informe um valor de compra válido.',
      });
      return;
    }

    setPurchaseLoading(true);

    try {
      /* 4a) avalia regras internas */
      await evaluatePurchase({
        user_id: client.id,
        amount,
        purchased_items: selectedItems.length ? selectedItems : undefined,
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
          purchased_items: selectedItems.length ? selectedItems : undefined,
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

  /* ------------------------------- paginação ------------------------------- */
  const hasPrevPage = itemSkip > 0;
  const hasNextPage = itemSkip + itemLimit < itemTotal;

  const goPrevPage = () => {
    if (hasPrevPage) setItemSkip(prev => Math.max(prev - itemLimit, 0));
  };

  const goNextPage = () => {
    if (hasNextPage) setItemSkip(prev => prev + itemLimit);
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
          onChange={e => setPurchaseAmount(e.target.value)}
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
              {items.map(item => {
                const checked = selectedItems.includes(item.id);
                return (
                  <label
                    key={item.id}
                    className={`${styles.itemLabel} ${
                      checked ? styles.itemLabelChecked : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setSelectedItems(prev =>
                          checked
                            ? prev.filter(id => id !== item.id)
                            : [...prev, item.id]
                        )
                      }
                    />
                    {item.name}
                  </label>
                );
              })}

              {/* paginação dos itens */}
              {itemTotal > itemLimit && (
                <div className={styles.pagination}>
                  <button
                    onClick={goPrevPage}
                    disabled={!hasPrevPage}
                  >
                    Anterior
                  </button>
                  <span>
                    {Math.floor(itemSkip / itemLimit) + 1} /{' '}
                    {Math.ceil(itemTotal / itemLimit)}
                  </span>
                  <button
                    onClick={goNextPage}
                    disabled={!hasNextPage}
                  >
                    Próxima
                  </button>
                </div>
              )}
            </div>

            {selectedItems.length > 0 && (
              <p className={styles.selectedHint}>
                Selecionados:&nbsp;
                {items
                  .filter(i => selectedItems.includes(i.id))
                  .map(i => i.name)
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

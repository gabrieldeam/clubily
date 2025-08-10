// src/app/admin/companies/page.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import {
  searchCompaniesAdmin,
  activateCompany,
  deactivateCompany,
} from '@/services/companyService';
import {
  listFeeSettings,
  patchFeeSetting,
} from '@/services/feeSettingService';
import {
  getPointsBalance,
  debitPoints,
  creditPoints,
  listPointsTransactions,
} from '@/services/pointsWalletService';
import {
  getCompanyWallet,
  adminCreditWallet,
  adminDebitWallet,
  listAdminWalletTransactions,
} from '@/services/walletService';
import type {
  CompanyRead,
  PaginationParams,
  Page,
} from '@/types/company';
import type {
  FeeSettingRead,
  SettingTypeEnum,
} from '@/types/feeSetting';
import type {
  PointsTransaction,
  PaginatedPointsTransactions,
} from '@/types/pointsWallet';
import type {
  WalletRead,
  WalletOperation,
  AdminWalletTransaction,
  PaginatedWalletTransactions,
} from '@/types/wallet';
import Modal from '@/components/Modal/Modal';
import Notification from '@/components/Notification/Notification';
import styles from './page.module.css';


const feeTypeLabels: Record<SettingTypeEnum, string> = {
  cashback: 'Cashback',
  points:   'Pontos',
  loyalty:  'Cartão Fidelidade',
  coupon:   'Cupom',     
};

// Tipos de configuração de taxa disponíveis
const allTypes: SettingTypeEnum[] = [
  'cashback',
  'points',
  'loyalty',
  'coupon',   
];

type NotificationState = {
  type: 'success' | 'error' | 'info';
  message: string;
};

type ViewMode = 'table' | 'cards';

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<CompanyRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';

  // Paginação
  const [page, setPage] = useState(1);
  const size = 10;
  const [total, setTotal] = useState(0);

  // Modal detalhes
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyRead | null>(null);

  // Modal taxa
  const [fsOpen, setFsOpen] = useState(false);
  const [fsCompany, setFsCompany] = useState<CompanyRead | null>(null);
  const [feeSettings, setFeeSettings] = useState<FeeSettingRead[]>([]);
  const [fsLoading, setFsLoading] = useState(false);
  const [fsError, setFsError] = useState('');

  // Notificação
  const [notification, setNotification] = useState<NotificationState | null>(null);

  // Modo de visualização
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // SALDO DE PONTOS
  const [balance, setBalance] = useState<number | null>(null);
  const [balLoading, setBalLoading] = useState(false);
  const [balError, setBalError] = useState('');

  // Carteira de créditos
  const [wallet, setWallet] = useState<WalletRead | null>(null);
  const [wLoading, setWLoading] = useState(false);
  const [wError, setWError] = useState('');

  // Operações de pontos
  const [opAmount, setOpAmount] = useState<number>(0);
  // Extrato de pontos
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [txTotal, setTxTotal] = useState(0);
  const [txPage, setTxPage] = useState(1);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState('');

  // Operações de créditos
  const [creditAmount, setCreditAmount] = useState<number>(0);
  // Extrato de créditos
  const [creditTransactions, setCreditTransactions] = useState<AdminWalletTransaction[]>([]);
  const [creditTxTotal, setCreditTxTotal] = useState(0);
  const [creditTxPage, setCreditTxPage] = useState(1);
  const [creditTxLoading, setCreditTxLoading] = useState(false);
  const [creditTxError, setCreditTxError] = useState('');

  // Qual extrato exibir
  const [txView, setTxView] = useState<'points' | 'credits'>('points');

  // Modal de Saldos
  const [balancesModalOpen, setBalancesModalOpen] = useState(false);
  const [balancesCompany, setBalancesCompany] = useState<CompanyRead | null>(null);

  // Memoiza a busca de empresas para usar no useEffect sem warnings
  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params: PaginationParams = { page, size };
      const res = await searchCompaniesAdmin(params);
      const data = res.data as Page<CompanyRead>;
      setCompanies(data.items);
      setTotal(data.total);
    } catch (error: unknown) {
      const msg = error instanceof Error
        ? error.message
        : 'Erro ao buscar empresas';
      setNotification({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  }, [page, size]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Carrega extrato de pontos
  async function loadTransactions(companyId: string, page = 1) {
    setTxLoading(true);
    setTxError('');
    try {
      const skip = (page - 1) * 5;
      const res = await listPointsTransactions(companyId, skip, 5);
      const data: PaginatedPointsTransactions = res.data;
      setTransactions(data.items);
      setTxTotal(data.total);
      setTxPage(page);
    } catch {
      setTxError('Erro ao carregar extrato de pontos');
    } finally {
      setTxLoading(false);
    }
  }

  // Carrega extrato de créditos
  async function loadCreditTransactions(companyId: string, page = 1) {
    setCreditTxLoading(true);
    setCreditTxError('');
    try {
      const skip = (page - 1) * 5;
      const res = await listAdminWalletTransactions(companyId, skip, 5);
      const data: PaginatedWalletTransactions = res.data;
      setCreditTransactions(data.items);
      setCreditTxTotal(data.total);
      setCreditTxPage(page);
    } catch {
      setCreditTxError('Erro ao carregar extrato de créditos');
    } finally {
      setCreditTxLoading(false);
    }
  }

  // Ativa ou desativa empresa
  async function toggleCompany(comp: CompanyRead) {
    setProcessingId(comp.id);
    try {
      if (comp.is_active) {
        await deactivateCompany(comp.id);
      } else {
        await activateCompany(comp.id);
      }
      await fetchCompanies();
      setNotification({
        type: 'success',
        message: `Empresa ${comp.name} atualizada com sucesso`,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error
        ? error.message
        : 'Erro ao atualizar empresa';
      setNotification({ type: 'error', message: msg });
    } finally {
      setProcessingId(null);
    }
  }

  // Handlers de débito/crédito de pontos
  async function handleBalancesDebitPoints() {
    if (!balancesCompany) return;
    try {
      const res = await debitPoints(balancesCompany.id, { points: opAmount });
      setBalance(res.data.balance);
      setNotification({ type: 'success', message: `Debitou ${opAmount} pts` });
      await loadTransactions(balancesCompany.id, 1);
    } catch (error: unknown) {
      const msg = error instanceof Error
        ? error.message
        : 'Erro no débito de pontos';
      setNotification({ type: 'error', message: msg });
    }
  }

  async function handleBalancesCreditPoints() {
    if (!balancesCompany) return;
    try {
      const res = await creditPoints(balancesCompany.id, { points: opAmount });
      setBalance(res.data.balance);
      setNotification({ type: 'success', message: `Creditou ${opAmount} pts` });
      await loadTransactions(balancesCompany.id, 1);
    } catch (error: unknown) {
      const msg = error instanceof Error
        ? error.message
        : 'Erro no crédito de pontos';
      setNotification({ type: 'error', message: msg });
    }
  }

  // Handlers de débito/crédito de créditos
  async function handleBalancesAdminCredit() {
    if (!balancesCompany) return;
    try {
      const payload: WalletOperation = { amount: creditAmount, description: '' };
      const res = await adminCreditWallet(balancesCompany.id, payload);
      setWallet(res.data);
      setNotification({ type: 'success', message: `Creditou R$${creditAmount}` });
      await loadCreditTransactions(balancesCompany.id, 1);
    } catch (error: unknown) {
      const msg = error instanceof Error
        ? error.message
        : 'Erro no crédito';
      setNotification({ type: 'error', message: msg });
    }
  }

  async function handleBalancesAdminDebit() {
    if (!balancesCompany) return;
    try {
      const payload: WalletOperation = { amount: creditAmount, description: '' };
      const res = await adminDebitWallet(balancesCompany.id, payload);
      setWallet(res.data);
      setNotification({ type: 'success', message: `Debitou R$${creditAmount}` });
      await loadCreditTransactions(balancesCompany.id, 1);
    } catch (error: unknown) {
      const msg = error instanceof Error
        ? error.message
        : 'Erro no débito';
      setNotification({ type: 'error', message: msg });
    }
  }

  // Abre modal de detalhes, carrega saldos e extratos
  async function openDetails(comp: CompanyRead) {
    setSelectedCompany(comp);
    setModalOpen(true);

    await Promise.all([
      loadTransactions(comp.id, 1),
      loadCreditTransactions(comp.id, 1),
    ]);

    // Saldo de pontos
    setBalLoading(true);
    setBalError('');
    try {
      const res = await getPointsBalance(comp.id);
      setBalance(res.data.balance);
    } catch {
      setBalError('Não foi possível carregar saldo de pontos');
      setBalance(null);
    } finally {
      setBalLoading(false);
    }

    // Carteira de créditos
    setWLoading(true);
    setWError('');
    try {
      const res2 = await getCompanyWallet(comp.id);
      setWallet(res2.data);
    } catch {
      setWError('Não foi possível carregar carteira de créditos');
      setWallet(null);
    } finally {
      setWLoading(false);
    }
  }

  function closeDetails() {
    setModalOpen(false);
    setSelectedCompany(null);
    setTransactions([]);
    setTxTotal(0);
    setTxPage(1);
    setOpAmount(0);
  }

  // Modal de configurações de taxa
  async function openFeeSettings(comp: CompanyRead) {
    setFsCompany(comp);
    setFsError('');
    setFsLoading(true);
    setFsOpen(true);
    try {
      const res = await listFeeSettings(comp.id);
      setFeeSettings(res.data);
    } catch {
      setFeeSettings([]);
    } finally {
      setFsLoading(false);
    }
  }

  function closeFeeSettings() {
    setFsOpen(false);
    setFeeSettings([]);
    setFsCompany(null);
  }

  async function handleFsSave(type: SettingTypeEnum) {
    if (!fsCompany) return;
    const existing = feeSettings.find(f => f.setting_type === type);
    const input = document.getElementById('fs-' + type) as HTMLInputElement;
    const fee_amount = parseFloat(input.value || '0');
    try {
      await patchFeeSetting(fsCompany.id, type, { fee_amount });
      const res = await listFeeSettings(fsCompany.id);
      setFeeSettings(res.data);

      setNotification({
        type: 'success',
        message: existing
          ? `Taxa "${type}" atualizada com sucesso!`
          : `Taxa "${type}" criada com sucesso!`,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error
        ? error.message
        : 'Erro ao salvar taxa';
      setFsError(msg);
      setNotification({ type: 'error', message: msg });
    }
  }

  // Modal de saldos
  async function openBalancesModal(comp: CompanyRead) {
    setBalancesCompany(comp);
    setBalancesModalOpen(true);
    setBalLoading(true);
    setWLoading(true);
    try {
      const [ptsRes, walletRes] = await Promise.all([
        getPointsBalance(comp.id),
        getCompanyWallet(comp.id),
      ]);
      setBalance(ptsRes.data.balance);
      setWallet(walletRes.data);
      await loadTransactions(comp.id, 1);
      await loadCreditTransactions(comp.id, 1);
    } catch {
      /* opcional: setar balError / wError */
    } finally {
      setBalLoading(false);
      setWLoading(false);
    }
  }

  function closeBalancesModal() {
    setBalancesModalOpen(false);
    setBalancesCompany(null);
  }

  const lastPage = Math.ceil(total / size);
  if (loading) return <p>Carregando empresas...</p>;

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
        <h1>Empresas</h1>
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

      {viewMode === 'table' ? (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>CNPJ</th>
                <th>Status</th>
                <th>Taxas</th>
                <th>Saldos</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {companies.map(comp => (
                <tr key={comp.id}>
                  <td data-label="Nome">{comp.name}</td>
                  <td data-label="CNPJ">{comp.cnpj}</td>
                  <td data-label="Status">
                    <span
                      className={
                        comp.is_active ? styles.badgeActive : styles.badgeInactive
                      }
                    >
                      {comp.is_active ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td data-label="Taxas">
                    <button
                      className={styles.btnPrimary}
                      onClick={() => openFeeSettings(comp)}
                    >
                      Ver/Editar
                    </button>
                  </td>
                  <td data-label="Saldos">
                    <button
                      className={styles.btnDetail}
                      onClick={() => openBalancesModal(comp)}
                    >
                      Ver Saldos
                    </button>
                  </td>
                  <td data-label="Ações" className={styles.actions}>
                    <button
                      className={styles.btnDetail}
                      onClick={() => openDetails(comp)}
                    >
                      Detalhes
                    </button>
                    <button
                      className={
                        comp.is_active ? styles.btnDeactivate : styles.btnActivate
                      }
                      onClick={() => toggleCompany(comp)}
                      disabled={processingId === comp.id}
                    >
                      {comp.is_active ? 'Desativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.cardsGrid}>
          {companies.map(comp => (
            <div key={comp.id} className={styles.card}>
              {comp.logo_url && (
                <Image
                  loader={({ src }) => src}
                  src={`${baseUrl}${comp.logo_url}`}
                  alt={`${comp.name} logo`}
                  width={100}
                  height={100}
                  className={styles.cardLogo}
                />
              )}
              <div className={styles.cardHeader}>
                <h2>{comp.name}</h2>
                <span
                  className={
                    comp.is_active ? styles.badgeActive : styles.badgeInactive
                  }
                >
                  {comp.is_active ? 'Ativa' : 'Inativa'}
                </span>
              </div>
              <div className={styles.cardBody}>
                <p><strong>CNPJ:</strong> {comp.cnpj}</p>
                <p><strong>Telefone:</strong> {comp.phone}</p>
              </div>
              <div className={styles.cardFooter}>
                <button
                  className={styles.btnPrimary}
                  onClick={() => openFeeSettings(comp)}
                >
                  Taxas
                </button>
                <button
                  className={styles.btnDetail}
                  onClick={() => openDetails(comp)}
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
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          ← Anterior
        </button>
        <span>{page} / {lastPage}</span>
        <button
          onClick={() => setPage(p => Math.min(lastPage, p + 1))}
          disabled={page === lastPage}
        >
          Próxima →
        </button>
      </div>

      {/* Modal de Taxas */}
      <Modal open={fsOpen} onClose={closeFeeSettings} width={600}>
        <div className={styles.detailGrid}>
          <h2>Taxas – {fsCompany?.name}</h2>
          {fsError && <p className={styles.error}>{fsError}</p>}
          {notification && (
            <Notification
              type={notification.type}
              message={notification.message}
              onClose={() => setNotification(null)}
            />
          )}
          {fsLoading ? (
            <p>Carregando taxas...</p>
          ) : (
            <form className={styles.formGrid}>
              {allTypes.map(type => {
                const existing = feeSettings.find(f => f.setting_type === type);
                return (
                  <div key={type} className={styles.fsRow}>
                    <label htmlFor={`fs-${type}`}>{feeTypeLabels[type]}</label>
                    <div className={styles.currencyInput}>
                      <span className={styles.currencySymbol}>R$</span>
                      <input
                        id={`fs-${type}`}
                        defaultValue={existing ? String(existing.fee_amount) : ''}
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFsSave(type)}
                      className={styles.btnPrimary}
                    >
                      {existing ? 'Atualizar' : 'Criar'}
                    </button>
                  </div>
                );
              })}
            </form>
          )}
        </div>
      </Modal>

      {/* Modal de Detalhes */}
      <Modal open={modalOpen} onClose={closeDetails} width={800}>
        {selectedCompany && (
          <div className={styles.detailGrid}>
            <section>
              <h3>Informações</h3>
              <div className={styles.detail}>
                {selectedCompany.logo_url && (
                  <Image
                    loader={({ src }) => src}
                    src={`${baseUrl}${selectedCompany.logo_url}`}
                    alt={`${selectedCompany.name} logo`}
                    width={120}
                    height={120}
                    className={styles.logo}
                  />
                )}
                <div>
                  <p><strong>Nome:</strong> {selectedCompany.name}</p>
                  <p><strong>Email:</strong> {selectedCompany.email}</p>
                  <p><strong>Telefone:</strong> {selectedCompany.phone}</p>
                  <p><strong>ID:</strong> {selectedCompany.id}</p>
                  {selectedCompany.description && (
                    <p><strong>Descrição:</strong> {selectedCompany.description}</p>
                  )}
                </div>
              </div>
            </section>

            <section>
              <h3>Endereço</h3>
              <p>
                {selectedCompany.street}, {selectedCompany.number}
                {selectedCompany.complement && `, ${selectedCompany.complement}`}
              </p>
              <p>
                {selectedCompany.neighborhood} – {selectedCompany.city}/{selectedCompany.state}
              </p>
              <p><strong>CEP:</strong> {selectedCompany.postal_code}</p>
            </section>

            <section>
              <h3>Categorias</h3>
              <ul className={styles.categories}>
                {selectedCompany.categories.map(cat => (
                  <li key={cat.id}>{cat.name}</li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </Modal>

      {/* Modal de Saldos e Extratos */}
      <Modal open={balancesModalOpen} onClose={closeBalancesModal} width={800}>
        {balancesCompany && (
          <div className={styles.detailGrid}>
            <h2>Saldos – {balancesCompany.name}</h2>

            {notification && (
              <Notification
                type={notification.type}
                message={notification.message}
                onClose={() => setNotification(null)}
              />
            )}

            <section className={styles.detail}>
              <div>
                <h3>Saldo de Pontos</h3>
                {balLoading ? (
                  <p>Carregando...</p>
                ) : balError ? (
                  <p className={styles.error}>{balError}</p>
                ) : (
                  <p>{balance} pts</p>
                )}
              </div>
              <div>
                <h3>Saldo de Créditos</h3>
                {wLoading ? (
                  <p>Carregando...</p>
                ) : wError ? (
                  <p className={styles.error}>{wError}</p>
                ) : wallet ? (
                  <p>{wallet.balance} ctds</p>
                ) : null}
              </div>
            </section>

            <section>
              <h3>Gerenciar Pontos</h3>
              <div className={styles.opContainer}>
                <input
                  type="number"
                  value={opAmount}
                  onChange={e => setOpAmount(parseInt(e.target.value, 10))}
                  placeholder="Quantidade de pontos"
                  min={0}
                />
                <button className={styles.btnPrimary} onClick={handleBalancesCreditPoints}>
                  Creditar
                </button>
                <button className={styles.btnSecondary} onClick={handleBalancesDebitPoints}>
                  Debitar
                </button>
              </div>
            </section>

            <section>
              <h3>Gerenciar Créditos</h3>
              <div className={styles.opContainer}>
                <input
                  type="number"
                  value={creditAmount}
                  onChange={e => setCreditAmount(parseFloat(e.target.value))}
                  placeholder="Valor em R$"
                  min={0}
                />
                <button className={styles.btnPrimary} onClick={handleBalancesAdminCredit}>
                  Creditar
                </button>
                <button className={styles.btnSecondary} onClick={handleBalancesAdminDebit}>
                  Debitar
                </button>
              </div>
            </section>

            <section>
              <div className={styles.detailHeader}>
                <h3>Extrato de Transações</h3>
                <div className={styles.viewToggle}>
                  <button
                    className={txView === 'points' ? styles.activeToggle : ''}
                    onClick={() => setTxView('points')}
                  >
                    Pontos
                  </button>
                  <button
                    className={txView === 'credits' ? styles.activeToggle : ''}
                    onClick={() => setTxView('credits')}
                  >
                    Créditos
                  </button>
                </div>
              </div>

              {txView === 'points' ? (
                txLoading ? (
                  <p>Carregando extrato de pontos...</p>
                ) : txError ? (
                  <p className={styles.error}>{txError}</p>
                ) : (
                  <>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Tipo</th>
                          <th>Quantidade</th>
                          <th>Descrição</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map(tx => (
                          <tr key={tx.id}>
                            <td>{new Date(tx.created_at).toLocaleString()}</td>
                            <td>{tx.type}</td>
                            <td>{tx.amount}</td>
                            <td>{tx.description ?? '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className={styles.pagination}>
                      <button
                        onClick={() => balancesCompany && loadTransactions(balancesCompany.id, txPage - 1)}
                        disabled={txPage === 1}
                      >
                        ← Anterior
                      </button>
                      <span>
                        {txPage} / {Math.ceil(txTotal / 5)}
                      </span>
                      <button
                        onClick={() => balancesCompany && loadTransactions(balancesCompany.id, txPage + 1)}
                        disabled={txPage >= Math.ceil(txTotal / 5)}
                      >
                        Próxima →
                      </button>
                    </div>
                  </>
                )
              ) : (
                creditTxLoading ? (
                  <p>Carregando extrato de créditos...</p>
                ) : creditTxError ? (
                  <p className={styles.error}>{creditTxError}</p>
                ) : (
                  <>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Tipo</th>
                          <th>Valor (R$)</th>
                          <th>Descrição</th>
                        </tr>
                      </thead>
                      <tbody>
                        {creditTransactions.map(tx => (
                          <tr key={tx.id}>
                            <td>{new Date(tx.created_at).toLocaleString()}</td>
                            <td>{tx.type}</td>
                            <td>{tx.amount}</td>
                            <td>{tx.description ?? '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className={styles.pagination}>
                      <button
                        onClick={() => balancesCompany && loadCreditTransactions(balancesCompany.id, creditTxPage - 1)}
                        disabled={creditTxPage === 1}
                      >
                        ← Anterior
                      </button>
                      <span>
                        {creditTxPage} / {Math.ceil(creditTxTotal / 5)}
                      </span>
                      <button
                        onClick={() => balancesCompany && loadCreditTransactions(balancesCompany.id, creditTxPage + 1)}
                        disabled={creditTxPage >= Math.ceil(creditTxTotal / 5)}
                      >
                        Próxima →
                      </button>
                    </div>
                  </>
                )
              )}
            </section>
          </div>
        )}
      </Modal>
    </div>
  );
}

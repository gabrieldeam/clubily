// src/app/admin/companies/page.tsx
'use client';

import { useEffect, useState } from 'react';
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
import { getCompanyWallet } from '@/services/walletService';
import type {
  CompanyRead,
  PaginationParams,
  Page,
} from '@/types/company';
import type {
  FeeSettingRead,
  SettingTypeEnum,
} from '@/types/feeSetting';
import type { PointsBalance, PointsTransaction, PaginatedPointsTransactions } from '@/types/pointsWallet';
import type { WalletRead } from '@/types/wallet';
import Modal from '@/components/Modal/Modal';
import Notification from '@/components/Notification/Notification';
import styles from './page.module.css';

// Tipos de configuração de taxa disponíveis
const allTypes: SettingTypeEnum[] = [
  'cashback',
  'points',
  'loyalty',
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
 
    // === NOVOS ESTADOS PARA WALLET ===
  const [wallet, setWallet] = useState<WalletRead | null>(null);
  const [wLoading, setWLoading] = useState(false);
  const [wError, setWError] = useState('');

    // === Estados de operações de pontos ===
  const [opAmount, setOpAmount] = useState<number>(0);
  // === Estados do extrato paginado ===
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [txTotal, setTxTotal] = useState(0);
  const [txPage, setTxPage] = useState(1);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState<string>('');

  useEffect(() => {
    fetchCompanies();
  }, [page]);

  async function fetchCompanies() {
    setLoading(true);
    try {
      const params: PaginationParams = { page, size };
      const res = await searchCompaniesAdmin(params);
      const data = res.data as Page<CompanyRead>;
      setCompanies(data.items);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }

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
    } catch (e: any) {
      setTxError('Erro ao carregar extrato');
    } finally {
      setTxLoading(false);
    }
  }

  async function toggleCompany(comp: CompanyRead) {
    setProcessingId(comp.id);
    try {
      if (comp.is_active) await deactivateCompany(comp.id);
      else await activateCompany(comp.id);
      await fetchCompanies();
      setNotification({ type: 'success', message: `Empresa ${comp.name} atualizada com sucesso` });
    } catch (e: any) {
      setNotification({ type: 'error', message: e.message || 'Erro ao atualizar empresa' });
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDebitPoints() {
    if (!selectedCompany) return;
    try {
      const res = await debitPoints(selectedCompany.id, { points: opAmount });
      setBalance(res.data.balance);
      setNotification({ type: 'success', message: `Debitou ${opAmount} pts` });
      await loadTransactions(selectedCompany!.id, txPage);
    } catch (e: any) {
      setNotification({ type: 'error', message: e.message || 'Erro no débito' });
    }
  }

  async function handleCreditPoints() {
    if (!selectedCompany) return;
    try {
      const res = await creditPoints(selectedCompany.id, { points: opAmount });
      setBalance(res.data.balance);
      setNotification({ type: 'success', message: `Creditou ${opAmount} pts` });
      await loadTransactions(selectedCompany!.id, txPage);
    } catch (e: any) {
      setNotification({ type: 'error', message: e.message || 'Erro no crédito' });
    }
  }

  async function openDetails(comp: CompanyRead) {
    // abre o modal e seleciona a empresa
    setSelectedCompany(comp);
    setModalOpen(true);
    await loadTransactions(comp.id, 1);

    // 1) Busca saldo simples (pointsBalance)
    setBalLoading(true);
    setBalError('');
    try {
      const res = await getPointsBalance(comp.id);
      const data: PointsBalance = res.data;
      setBalance(data.balance);
    } catch (e: any) {
      setBalError('Não foi possível carregar saldo');
      setBalance(null);
    } finally {
      setBalLoading(false);
    }

    // 2) Busca carteira completa (WalletRead)
    setWLoading(true);
    setWError('');
    try {
      const res2 = await getCompanyWallet(comp.id);
      setWallet(res2.data);
    } catch (e: any) {
      setWError('Não foi possível carregar carteira');
      setWallet(null);
    } finally {
      setWLoading(false);
    }
  }

  function closeDetails() {
    setModalOpen(false);
    setSelectedCompany(null);
    // limpa estados relacionados
    setTransactions([]);
    setTxTotal(0);
    setTxPage(1);
    setOpAmount(0);
  }

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
    // chama o PATCH (upsert)
    await patchFeeSetting(fsCompany.id, type, { fee_amount });
    // recarrega
    const res = await listFeeSettings(fsCompany.id);
    setFeeSettings(res.data);

    // notificação de sucesso específica
    if (existing) {
      setNotification({
        type: 'success',
        message: `Taxa "${type}" atualizada com sucesso!`
      });
    } else {
      setNotification({
        type: 'success',
        message: `Taxa "${type}" criada com sucesso!`
      });
    }
  } catch (e: any) {
    const msg = e.message || 'Erro ao salvar taxa';
    setFsError(msg);
    setNotification({ type: 'error', message: msg });
  }
}

  const lastPage = Math.ceil(total / size);
  if (loading) return <p>Carregando empresas...</p>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Empresas</h1>
        <div className={styles.viewToggle}>
          <button
            className={viewMode === 'table' ? styles.activeToggle : ''}
            onClick={() => setViewMode('table')}
          >Tabela</button>
          <button
            className={viewMode === 'cards' ? styles.activeToggle : ''}
            onClick={() => setViewMode('cards')}
          >Cards</button>
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
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {companies.map(comp => (
                <tr key={comp.id}>
                  <td data-label="Nome">{comp.name}</td>
                  <td data-label="CNPJ">{comp.cnpj}</td>
                  <td data-label="Status">
                    <span className={
                      comp.is_active ? styles.badgeActive : styles.badgeInactive
                    }>{comp.is_active ? 'Ativa' : 'Inativa'}</span>
                  </td>
                  <td data-label="Taxas">
                    <button
                      className={styles.btnPrimary}
                      onClick={() => openFeeSettings(comp)}
                    >Ver/Editar</button>
                  </td>
                  <td data-label="Ações" className={styles.actions}>
                    <button
                      className={styles.btnDetail}
                      onClick={() => openDetails(comp)}
                    >Detalhes</button>
                    <button
                      className={
                        comp.is_active ? styles.btnDeactivate : styles.btnActivate
                      }
                      onClick={() => toggleCompany(comp)}
                      disabled={processingId === comp.id}
                    >{comp.is_active ? 'Desativar' : 'Ativar'}</button>
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
              {comp.logo_url && <img
                src={`${baseUrl}${comp.logo_url}`}
                alt={`${comp.name} logo`}
                className={styles.cardLogo}
              />}
              <div className={styles.cardHeader}>
                <h2>{comp.name}</h2>
                <span className={
                  comp.is_active ? styles.badgeActive : styles.badgeInactive
                }>{comp.is_active ? 'Ativa' : 'Inativa'}</span>
              </div>
              <div className={styles.cardBody}>
                <p><strong>CNPJ:</strong> {comp.cnpj}</p>
                <p><strong>Telefone:</strong> {comp.phone}</p>
              </div>
              <div className={styles.cardFooter}>
                <button className={styles.btnPrimary} onClick={() => openFeeSettings(comp)}>
                  Taxas</button>
                <button className={styles.btnDetail} onClick={() => openDetails(comp)}>
                  Detalhes</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.pagination}>
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
          ← Anterior</button>
        <span>{page} / {lastPage}</span>
        <button onClick={() => setPage(p => Math.min(lastPage, p + 1))} disabled={page === lastPage}>
          Próxima →</button>
      </div>

      <Modal open={fsOpen} onClose={closeFeeSettings} width={600}>
        <div className={styles.detailGrid}>
          <h2>Taxas – {fsCompany?.name}</h2>
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
            <>              
              <form className={styles.formGrid}>
                {allTypes.map(type => {
                  const existing = feeSettings.find(f => f.setting_type === type);
                  return (
                    <div key={type} className={styles.fsRow}>
                      <label htmlFor={'fs-' + type}>{type}</label>
                      <input
                        id={'fs-' + type}
                        defaultValue={existing ? String(existing.fee_amount) : ''}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                      />
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
            </>
          )}
        </div>
      </Modal>

      <Modal open={modalOpen} onClose={closeDetails} width={800}>
        {selectedCompany && (
          <div className={styles.detailGrid}>              
              <section>
                <h3>Informações</h3> 
                <div className={styles.detail}>
                  <div>
                    {selectedCompany.logo_url && (
                      <img
                        src={`${baseUrl}${selectedCompany.logo_url}`}
                        alt={`${selectedCompany.name} logo`}
                        className={styles.logo}
                      />
                    )}
                  </div>             
                  <div>
                    <p><strong>Nome:</strong> {selectedCompany.name}</p>
                    <p><strong>Email:</strong> {selectedCompany.email}</p>
                    <p><strong>Telefone:</strong> {selectedCompany.phone}</p>
                    <p><strong>ID:</strong> {selectedCompany.id}</p>
                    {selectedCompany.description && (                      
                      <p><strong>Descrição:</strong>{selectedCompany.description}</p>                      
                    )}
                    <div className={styles.detail}>
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
                  </div>
                </div>

              </section>

              
            <div className={styles.detail}>
              <section className={styles.detail}>
                <div>
                  <h3>Saldo de Pontos</h3>
                  {balLoading ? (
                    <p>Carregando...</p>
                  ) : balError ? (
                    <p>{balError}</p>
                  ) : (
                    <p>{balance} pts</p>
                  )}
                </div>
                <div>
                  <h3>Saldo de Créditos</h3>
                  {wLoading ? (
                    <p>Carregando...</p>
                  ) : wError ? (
                    <p>{wError}</p>
                  ) : wallet ? (
                    <p>{wallet.balance} ctds</p>
                  ) : null}
                </div>
              </section>
              
              {/* Nova Seção: Operações de Crédito/Débito */}
              <section className={styles.detail}>
                <h3>Gerenciar Pontos</h3>
                <div>
                  {notification && (
                  <Notification
                    type={notification.type}
                    message={notification.message}
                    onClose={() => setNotification(null)}
                  />
                )}
                <div className={styles.opContainer}>
                  <input
                    type="number"
                    value={opAmount}
                    onChange={e => setOpAmount(parseInt(e.target.value, 10))}
                    placeholder="Quantidade de pontos"
                    min={0}
                  />
                  <button className={styles.btnPrimary} onClick={handleCreditPoints}>
                    Creditar
                  </button>
                  <button className={styles.btnSecondary} onClick={handleDebitPoints}>
                    Debitar
                  </button>
                </div>
                </div>
              </section>
            </div>

            {/* Nova Seção: Extrato Paginado */}
            <section>
              <h3>Extrato de Transações</h3>
              {txLoading ? (
                <p>Carregando extrato...</p>
              ) : txError ? (
                <p>{txError}</p>
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
                      onClick={() =>
                        selectedCompany &&
                        loadTransactions(selectedCompany.id, txPage - 1)
                      }
                      disabled={txPage === 1}
                    >
                      ← Anterior
                    </button>

                    <button
                      onClick={() =>
                        selectedCompany &&
                        loadTransactions(selectedCompany.id, txPage + 1)
                      }
                      disabled={txPage >= Math.ceil(txTotal / 5)}
                    >
                      Próxima →
                    </button>
                  </div>
                </>
              )}
            </section>  
          </div>
        )}
      </Modal>
    </div>
  );
}

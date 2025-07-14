// src/app/clients/page.tsx
'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header/Header';
import Modal from '@/components/Modal/Modal';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import Notification from '@/components/Notification/Notification';
import Button from '@/components/Button/Button';
import ClientModal from '@/components/ClientModal/ClientModal';
import RedeemRewardModal from '@/components/RedeemRewardModal/RedeemRewardModal';
import { checkPreRegistered } from '@/services/userService';
import type { CheckPreRegisteredParams } from '@/types/user';
import UserStatsCard from '@/components/UserStatsCard/UserStatsCard';
import { getCashbackPrograms, getUserProgramStats } from '@/services/cashbackProgramService';
import { listCompanyClients } from '@/services/companyService';
import { getUserWallet, withdrawUserWallet } from '@/services/walletService';
import type { UserRead } from '@/types/user';
import type { UserWalletRead } from '@/types/wallet';
import type { CashbackProgramRead, UserProgramStats } from '@/types/cashbackProgram';
import { isAxiosError } from 'axios';
import styles from './page.module.css';

export default function ClientsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // paginação
  const LIMIT = 10;
  const [page, setPage] = useState(0);
  const [clients, setClients] = useState<UserRead[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);

  // modais
  const [openModal, setOpenModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<UserRead | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // modo de visualização: 'list' ou 'card'
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');

  const [programs, setPrograms] = useState<CashbackProgramRead[]>([]);
  const [progLoading, setProgLoading] = useState(false);
  const [selectedProg, setSelectedProg] = useState<string>('');
  const [userStats, setUserStats] = useState<UserProgramStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // ** pesquisa **
  const [searchBy, setSearchBy] = useState<'cpf' | 'phone'>('cpf');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // carteira do usuário
  const [userWallet, setUserWallet] = useState<UserWalletRead | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [redeemOpen, setRedeemOpen] = useState(false);

  // detecta mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // em mobile, força card
  useEffect(() => {
    if (isMobile) setViewMode('card');
  }, [isMobile]);

  // protege rota
  useEffect(() => {
    if (!loading && !user) router.replace('/');
  }, [loading, user, router]);

  // busca clientes
  useEffect(() => {
    if (!user) return;
    setLoadingClients(true);
    listCompanyClients(page * LIMIT, LIMIT)
      .then(res => setClients(res.data))
      .catch(console.error)
      .finally(() => setLoadingClients(false));
  }, [user, page]);

  useEffect(() => {
    if (!selectedClient) return;
    // programas
    setProgLoading(true);
    getCashbackPrograms()
      .then(r => setPrograms(r.data))
      .catch(console.error)
      .finally(() => setProgLoading(false));

    // carteira
    setWalletLoading(true);
    getUserWallet(selectedClient.id)
      .then(r => setUserWallet(r.data))
      .catch(console.error)
      .finally(() => setWalletLoading(false));
  }, [selectedClient]);

  // when selectedProg changes, fetch stats
  useEffect(() => {
    if (!selectedClient?.id || !selectedProg) {
      setUserStats(null);
      return;
    }
    setStatsLoading(true);
    getUserProgramStats(selectedProg, selectedClient.id)
      .then(r => setUserStats(r.data))
      .catch(console.error)
      .finally(() => setStatsLoading(false));
  }, [selectedProg, selectedClient]);

  useEffect(() => {
    if (programs.length > 0 && !selectedProg) {
      setSelectedProg(programs[0].id);
    }
  }, [programs, selectedProg]);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const raw = searchTerm.replace(/\D/g, '');
    if (!raw) {
      setSearchError(`Informe um ${searchBy === 'phone' ? 'telefone' : 'CPF'}.`);
      return;
    }

    setSearchLoading(true);
    setSearchError(null);

    const params: CheckPreRegisteredParams = {
      company_id: user.id,
      ...(searchBy === 'phone' ? { phone: raw } : { cpf: raw }),
    };

    try {
      const res = await checkPreRegistered(params);
      setSelectedClient(res.data);
      setOpenModal(true);
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 404) {
        setSearchError('Cliente não encontrado.');
      } else {
        setSearchError('Erro ao buscar cliente.');
      }
    } finally {
      setSearchLoading(false);
    }
  };

  // saque da carteira do usuário
  const handleWithdraw = async () => {
    if (!selectedClient) return;
    const amt = parseFloat(withdrawAmount.replace(',', '.'));
    if (isNaN(amt) || amt <= 0) {
      setWithdrawError('Informe um valor válido.');
      return;
    }
    setWithdrawLoading(true);
    setWithdrawError(null);

    try {
      const res = await withdrawUserWallet(selectedClient.id, { amount: amt });
      setUserWallet(res.data); // já vem o novo saldo
      setWithdrawAmount('');
    } catch (err) {
      if (isAxiosError(err)) {
        setWithdrawError(err.response?.data?.detail || 'Erro ao debitar.');
      } else {
        setWithdrawError('Erro ao debitar.');
      }
    } finally {
      setWithdrawLoading(false);
    }
  };

  if (loading) return <div className={styles.container}>Carregando perfil...</div>;
  if (!user) return null;

  const openAddModal = () => {
    setSelectedClient(null);
    setOpenModal(true);
  };

  const openClientModal = (client: UserRead) => {
    setSelectedClient(client);
    setOpenModal(true);
  };

  // formatadores
  const formatPhoneDisplay = (c: UserRead) =>
    c.phone && c.phone.trim() !== '' ? c.phone : '*****';

  const formatCpfDisplay = (c: UserRead) => {
    if (!c.cpf || c.cpf.trim() === '') return '*****';
    if (!c.phone || c.phone.trim() === '') return c.cpf;
    const cpfLast4 = c.cpf.slice(-4);
    const phoneLast4 = c.phone.slice(-4);
    return cpfLast4 === phoneLast4 ? '*****' : c.cpf;
  };

  return (
    <>
      <Header />
      <div className={styles.container}>
        <main className={styles.main}>
          <div className={styles.headerRow}>
            <h2>Meus Clientes</h2>
            <div className={styles.actionsHeader}>
              {!isMobile && (
                <form onSubmit={handleSearch}>
                  <div className={styles.searchGroup}>
                    <select
                      value={searchBy}
                      onChange={e => setSearchBy(e.target.value as 'phone' | 'cpf')}
                      className={styles.searchSelect}
                    >
                      <option value="phone">Telefone</option>
                      <option value="cpf">CPF</option>
                    </select>
                    <input
                      type="text"
                      placeholder={searchBy === 'phone' ? 'Digite o telefone' : 'Digite o CPF'}
                      className={styles.searchInput}
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                    <button type="submit" disabled={searchLoading} className={styles.searchBtn}>
                      Buscar
                    </button>
                  </div>
                  {searchLoading && <div className={styles.loadingOverlay}>Buscando…</div>}
                  {searchError && <p className={styles.searchError}>{searchError}</p>}
                </form>
              )}

              <button className={styles.addBtn} onClick={openAddModal}>
                Adicionar Cliente
              </button>
              <button className={styles.addBtnReward} onClick={() => setRedeemOpen(true)}>Resgatar Recompensa</button>
              {!isMobile && (
                <button
                  className={styles.viewToggleBtn}
                  onClick={() => setViewModalOpen(true)}
                >
                  ⋮
                </button>
              )}
            </div>

          </div>

          {isMobile && (
            <form onSubmit={handleSearch}>
              <div className={styles.searchGroup}>
                <select
                  value={searchBy}
                  onChange={e => setSearchBy(e.target.value as 'phone' | 'cpf')}
                  className={styles.searchSelect}
                >
                  <option value="phone">Telefone</option>
                  <option value="cpf">CPF</option>
                </select>
                <input
                  type="text"
                  placeholder={searchBy === 'phone' ? 'Digite o telefone' : 'Digite o CPF'}
                  className={styles.searchInput}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                <button type="submit" disabled={searchLoading} className={styles.searchBtn}>
                  Buscar
                </button>
              </div>
              {searchLoading && <div className={styles.loadingOverlay}>Buscando…</div>}
              {searchError && <p className={styles.searchError}>{searchError}</p>}
            </form>
          )}

          {loadingClients ? (
            <p className={styles.loading}>Carregando clientes...</p>
          ) : clients.length > 0 ? (
            <>
              {viewMode === 'list' ? (
                <div className={styles.tableWrapper}>
                  <div className={styles.rowHeader}>
                    <div className={styles.cellName}>Nome</div>
                    <div className={styles.cellEmail}>Email</div>
                    <div className={styles.cellPhone}>Telefone</div>
                    <div className={styles.cellPhone}>CPF</div>
                  </div>
                  <div className={styles.body}>
                    {clients.map(c => (
                      <div
                        key={c.id}
                        className={`${styles.row} ${c.pre_registered ? styles.masked : ''}`}
                        onClick={() => openClientModal(c)}
                        title={c.pre_registered ? 'Usuário pré-cadastrado' : undefined}
                      >
                        <div className={styles.cellName} data-label="Nome:">
                          {c.pre_registered ? '*****' : c.name}
                        </div>
                        <div className={styles.cellEmail} data-label="Email:">
                          {c.pre_registered ? '*****' : c.email}
                        </div>
                        <div className={styles.cellPhone} data-label="Telefone:">
                          {formatPhoneDisplay(c)}
                        </div>
                        <div className={styles.cellPhone} data-label="CPF:">
                          {formatCpfDisplay(c)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className={styles.cardGrid}>
                  {clients.map(c => (
                    <div
                      key={c.id}
                      className={styles.card}
                      onClick={() => openClientModal(c)}
                    >
                      <div className={styles.cardHeader}>
                        <h3>{c.pre_registered ? '*****' : c.name}</h3>
                        {c.pre_registered && (
                          <span className={styles.cardBadge}>Pré-cadastrado</span>
                        )}
                      </div>
                      <p className={styles.cardSubtitle}>
                        {c.pre_registered ? '*****' : c.email}
                      </p>
                      <div className={styles.cardDetails}>
                        <p>
                          <strong>Telefone:</strong> {formatPhoneDisplay(c)}
                        </p>
                        <p>
                          <strong>CPF:</strong> {formatCpfDisplay(c)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.pagination}>
                <button
                  onClick={() => setPage(p => Math.max(p - 1, 0))}
                  disabled={page === 0}
                >
                  Anterior
                </button>
                <span>Página {page + 1}</span>
                <button
                  onClick={() =>
                    clients.length === LIMIT ? setPage(p => p + 1) : undefined
                  }
                  disabled={clients.length < LIMIT}
                >
                  Próxima
                </button>
              </div>
            </>
          ) : (
            <p className={styles.loading}>
              Nenhum cliente encontrado na página atual.
            </p>
          )}
        </main>

        {/* Modal de detalhes / edição */}
        <Modal open={openModal} onClose={() => setOpenModal(false)}>
          {selectedClient ? (
            <div className={styles.modalContent}>
              <h2 className={styles.title}>Dados do Cliente</h2>
              <div className={styles.userInfo}>
                <p><strong>Nome:</strong> {selectedClient.pre_registered ? '*****' : selectedClient.name}</p>
                <p><strong>E-mail:</strong> {selectedClient.pre_registered ? '*****' : selectedClient.email}</p>
                <p><strong>Telefone:</strong> {formatPhoneDisplay(selectedClient)}</p>
                <p><strong>CPF:</strong> {formatCpfDisplay(selectedClient)}</p>
              </div>

              {/* estatísticas */}
              {progLoading ? (
                <p>Carregando programas…</p>
              ) : (
                <>
                  <label htmlFor="stats-program" className={styles.label}>
                    Selecione o programa
                  </label>
                  <select
                    id="stats-program"
                    className={styles.select}
                    value={selectedProg}
                    onChange={e => setSelectedProg(e.target.value)}
                  >
                    <option value="">-- nenhum --</option>
                    {programs.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>

                  {statsLoading ? (
                    <p>Carregando estatísticas…</p>
                  ) : userStats && selectedProg ? (
                    <>
                      <UserStatsCard
                        title="Todos os programas"
                        validCount={userStats.company_valid_count}
                        totalCashback={userStats.company_total_cashback}
                      />
                      <UserStatsCard
                        title={`Programa: ${programs.find(p => p.id === selectedProg)?.name}`}
                        validCount={userStats.program_valid_count}
                        totalCashback={userStats.program_total_cashback}
                      />
                    </>
                  ) : null}

                  <div className={styles.walletCard}>
                    <h3 className={styles.sectionTitle}>Carteira</h3>
                    {walletLoading ? (
                      <p>Carregando saldo…</p>
                    ) : userWallet ? (
                      <>
                        <div className={styles.balanceRow}>
                          <span>Saldo Atual:</span><strong>R$ {Number(userWallet.balance).toFixed(2)}</strong>
                        </div>
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
                        {withdrawError && (
                          <Notification type="error" message={withdrawError} onClose={() => setWithdrawError(null)} />
                        )}
                      </>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          ) : (
            <ClientModal onClose={() => setOpenModal(false)} />
          )}
        </Modal>

        {/* Modal de escolha de visualização */}
        <Modal open={viewModalOpen} onClose={() => setViewModalOpen(false)}>
          <div className={styles.viewModeModal}>
            <h2>Escolha o modo de visualização</h2>
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
        <Modal open={redeemOpen} onClose={() => setRedeemOpen(false)}>
          <RedeemRewardModal
            onClose={() => setRedeemOpen(false)}
            onRedeemed={msg => {
              // opcional: ex. atualizar estoque / listar históricos…
              console.log(msg);
            }}
          />
        </Modal>
      </div>
    </>
  );
}

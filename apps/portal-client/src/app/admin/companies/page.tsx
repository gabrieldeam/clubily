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
import type {
  CompanyRead,
  PaginationParams,
  Page,
} from '@/types/company';
import type {
  FeeSettingRead,
  SettingTypeEnum,
} from '@/types/feeSetting';
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

  function openDetails(comp: CompanyRead) {
    setSelectedCompany(comp);
    setModalOpen(true);
  }
  function closeDetails() {
    setModalOpen(false);
    setSelectedCompany(null);
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

      <Modal open={modalOpen} onClose={closeDetails} width={700}>
        {selectedCompany && (
          <div className={styles.detailGrid}>
            <div className={styles.detailLeft}>
              <h2>{selectedCompany.name}</h2>
              {selectedCompany.logo_url && (
                <img
                  src={`${baseUrl}${selectedCompany.logo_url}`}
                  alt={`${selectedCompany.name} logo`}
                  className={styles.logo}
                />
              )}
              <section>
                <h3>Contato</h3>
                <p><strong>Email:</strong> {selectedCompany.email}</p>
                <p><strong>Telefone:</strong> {selectedCompany.phone}</p>
              </section>
            </div>
            <div className={styles.detailRight}>
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
              {selectedCompany.description && (
                <section>
                  <h3>Descrição</h3>
                  <p>{selectedCompany.description}</p>
                </section>
              )}
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
        )}
      </Modal>
    </div>
  );
}

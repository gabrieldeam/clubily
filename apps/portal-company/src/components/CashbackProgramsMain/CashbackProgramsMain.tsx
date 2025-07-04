// src/components/CashbackProgramsMain/CashbackProgramsMain.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Modal from '@/components/Modal/Modal';
import Notification from '@/components/Notification/Notification';
import {
  getCashbackPrograms,
  createCashbackProgram,
  updateCashbackProgram,
  deleteCashbackProgram,
} from '@/services/cashbackProgramService';
import type { CashbackProgramRead, CashbackProgramCreate } from '@/types/cashbackProgram';
import CashbackProgramModal from '@/components/CashbackProgramsMain/CashbackProgramModal/CashbackProgramModal';
import styles from './CashbackProgramsMain.module.css';

export default function CashbackProgramsMain() {
  const [programs, setPrograms] = useState<CashbackProgramRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<CashbackProgramRead | null>(null);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [isMobile, setIsMobile] = useState(false);

  // detectar mobile e forçar card
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  useEffect(() => {
    if (isMobile) setViewMode('card');
  }, [isMobile]);

  // buscar programas
  const fetchPrograms = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCashbackPrograms();
      setPrograms(res.data);
    } catch (e: any) {
      // captura detail do HTTPException
      setError(e.response?.data?.detail || 'Erro ao carregar programas');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchPrograms(); }, []);

  // contadores
  const total = programs.length;
  const activeCount = programs.filter(p => p.is_active).length;
  const visibleCount = programs.filter(p => p.is_visible).length;

  // ações CRUD
  const openCreate = () => {
    setError(null);
    setSelected(null);
    setModalOpen(true);
  };
  const openEdit = (p: CashbackProgramRead) => {
    setError(null);
    setSelected(p);
    setModalOpen(true);
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este programa?')) return;
    setError(null);
    try {
      await deleteCashbackProgram(id);
      await fetchPrograms();
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Erro ao excluir programa');
    }
  };
  const handleSave = async (data: CashbackProgramCreate, id?: string) => {
    setError(null);
    try {
      if (id) await updateCashbackProgram(id, data);
      else await createCashbackProgram(data);
      setModalOpen(false);
      await fetchPrograms();
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Erro ao salvar programa');
    }
  };
  
  return (
    <main className={styles.main}>
      <div className={styles.topBar}>
        <div className={styles.summary}>
          <h2>Cashback</h2>
          {!isMobile && (
            <>
              <div>Total <strong>{total}</strong></div>
              <div>Ativos <strong>{activeCount}</strong></div>
              <div>Visíveis <strong>{visibleCount}</strong></div>
            </>
          )}
        </div>
        {error && (
            <Notification
              type="error"
              message={error}
              onClose={() => setError(null)}
            />
          )}
        <div className={styles.actionsHeader}>
          <button className={styles.addBtn} onClick={openCreate}>
            + Novo Programa
          </button>
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

      {loading ? (
        <p className={styles.loading}>Carregando programas...</p>
      ) : total === 0 ? (
        <div className={styles.empty}>
          <h2>Você ainda não criou nenhum programa</h2>
          <p>
            Crie seu primeiro programa de cashback para começar a fidelizar
            seus clientes!
          </p>
          <button className={styles.createBtn} onClick={openCreate}>
            Criar Programa
          </button>
        </div>
      ) : viewMode === 'list' ? (
        <div className={styles.tableWrapper}>
          <div className={styles.tableHeader}>
            <div className={styles.colName}>Nome</div>
            <div className={styles.colDesc}>Descrição</div>
            <div className={styles.colPct}>%</div>
            <div className={styles.colValidity}>Validade</div>
            <div className={styles.colStatus}>Status</div>
            <div className={styles.colVisible}>Visível</div>
            <div className={styles.colActions}>Ações</div>
          </div>
          <div className={styles.tableBody}>
            {programs.map(p => (
              <div key={p.id} className={styles.tableRow}>
                <div className={styles.colName} data-label="Nome:">{p.name}</div>
                <div className={styles.colDesc} data-label="Descrição:">{p.description}</div>
                <div className={styles.colPct} data-label="%:">{p.percent}%</div>
                <div className={styles.colValidity} data-label="Validade:">
                  {p.validity_days} dia{p.validity_days > 1 && 's'}
                </div>
                <div className={styles.colStatus} data-label="Status:">
                  {p.is_active ? 'Ativo' : 'Inativo'}
                </div>
                <div className={styles.colVisible} data-label="Visível:">
                  {p.is_visible ? 'Sim' : 'Não'}
                </div>
                <div className={styles.colActions}>
                  <Link href={`/programs/cashback/${p.id}`} className={styles.view}>🔍</Link>
                  <button className={styles.edit} onClick={() => openEdit(p)}>✏️</button>
                  <button className={styles.delete} onClick={() => handleDelete(p.id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.cardGrid}>
          {programs.map(p => (
            <div key={p.id} className={styles.card} onClick={() => openEdit(p)}>
              <div className={styles.cardHeader}>
                <h3>{p.name}</h3>
                <span className={styles.cardBadge}>{p.percent}%</span>
              </div>
              <p className={styles.cardSubtitle}>{p.description}</p>
              <div className={styles.cardDetails}>
                <p><strong>Validade:</strong> {p.validity_days} dia{p.validity_days > 1 && 's'}</p>
                <p><strong>Status:</strong> {p.is_active ? 'Ativo' : 'Inativo'}</p>
                <p><strong>Visível:</strong> {p.is_visible ? 'Sim' : 'Não'}</p>
              </div>
              <div className={styles.cardActions}>
                <Link href={`/programs/cashback/${p.id}`} className={styles.view}>🔍 Ver</Link>
                <button className={styles.edit}>✏️ Editar</button>
                <button className={styles.delete}>🗑️ Excluir</button>
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
            <button onClick={() => { setViewMode('list'); setViewModalOpen(false); }}>📄 Lista</button>
            <button onClick={() => { setViewMode('card'); setViewModalOpen(false); }}>🧾 Card</button>
          </div>
        </div>
      </Modal>

      {/* CRUD modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <CashbackProgramModal
          program={selected}
          onSave={handleSave}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </main>
  );
}

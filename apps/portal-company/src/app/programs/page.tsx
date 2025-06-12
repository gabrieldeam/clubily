// src/app/programs/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header/Header';
import Modal from '@/components/Modal/Modal';
import {
  getCashbackPrograms,
  createCashbackProgram,
  updateCashbackProgram,
  deleteCashbackProgram,
} from '@/services/cashbackProgramService';
import type { CashbackProgramRead, CashbackProgramCreate } from '@/types/cashbackProgram';
import CashbackProgramModal from '@/components/CashbackProgramModal/CashbackProgramModal';
import styles from './page.module.css';

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<CashbackProgramRead[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<CashbackProgramRead | null>(null);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');

  const fetchPrograms = () => {
    setLoading(true);
    getCashbackPrograms()
      .then(res => setPrograms(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(fetchPrograms, []);

  const total = programs.length;
  const active = programs.filter(p => p.is_active).length;
  const visible = programs.filter(p => p.is_visible).length;

  const openCreate = () => {
    setSelected(null);
    setModalOpen(true);
  };
  const openEdit = (p: CashbackProgramRead) => {
    setSelected(p);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir este programa?')) {
      await deleteCashbackProgram(id);
      fetchPrograms();
    }
  };

  const handleSave = async (data: CashbackProgramCreate, id?: string) => {
    if (id) await updateCashbackProgram(id, data);
    else await createCashbackProgram(data);
    setModalOpen(false);
    fetchPrograms();
  };

  return (
    <div className={styles.container}>
      <Header onSearch={() => {}} />

      <main className={styles.main}>
        <div className={styles.topBar}>
          <div className={styles.summary}>
            <h2>Programas de Cashback</h2>
            <div>Total <strong>{total}</strong></div>
            <div>Ativos <strong>{active}</strong></div>
            <div>Visíveis <strong>{visible}</strong></div>
          </div>
          <div className={styles.actionsHeader}>
            <button
              className={styles.viewToggleBtn}
              onClick={() => setViewModalOpen(true)}
            >
              Mudar Visualização
            </button>
            <button className={styles.addBtn} onClick={openCreate}>
              + Novo Programa
            </button>
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
                  <button className={styles.edit}>✏️ Editar</button>
                  <button className={styles.delete}>🗑️ Excluir</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <CashbackProgramModal
          program={selected}
          onSave={handleSave}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <Modal open={viewModalOpen} onClose={() => setViewModalOpen(false)}>
        <div className={styles.viewModeModal}>
          <h2>Modo de visualização</h2>
          <div className={styles.viewOptions}>
            <button onClick={() => { setViewMode('list'); setViewModalOpen(false); }}>📄 Lista</button>
            <button onClick={() => { setViewMode('card'); setViewModalOpen(false); }}>🧾 Card</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

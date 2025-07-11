// /components/BranchesMain/BranchesMain.tsx
'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/Modal/Modal';
import {
  listBranches,
  createBranch,
  updateBranch,
  deleteBranch
} from '@/services/branchService';
import type { BranchRead, BranchCreate } from '@/types/branch';
import BranchModal from './BranchModal/BranchModal';
import styles from './BranchesMain.module.css';

export default function BranchesMain() {
  const [branches, setBranches] = useState<BranchRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<BranchRead | null>(null);

  // view mode
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const fetchBranches = () => {
    setLoading(true);
    listBranches()
      .then(res => setBranches(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(fetchBranches, []);

  // detect mobile width <768px
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // força card em mobile
  useEffect(() => {
    if (isMobile) setViewMode('card');
  }, [isMobile]);

  const openCreate = () => {
    setSelected(null);
    setModalOpen(true);
  };

  const openEdit = (b: BranchRead) => {
    setSelected(b);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir esta filial?')) {
      await deleteBranch(id);
      fetchBranches();
    }
  };

  const handleSave = async (data: BranchCreate, id?: string) => {
    if (id) await updateBranch(id, data);
    else await createBranch(data);
    setModalOpen(false);
    fetchBranches();
  };

  return (
    <main className={styles.main}>
      <div className={styles.topBar}>
        <h2>Filiais</h2>
        <div className={styles.actionsHeader}>          
          <button className={styles.addBtn} onClick={openCreate}>
            + Nova Filial
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
        <p className={styles.loading}>Carregando filiais...</p>
      ) : branches.length === 0 ? (
        <div className={styles.empty}>
          <h3>Sem filiais cadastradas</h3>
          <button onClick={openCreate} className={styles.createBtn}>
            Criar primeira filial
          </button>
        </div>
      ) : viewMode === 'list' ? (
        <div className={styles.tableWrapper}>
          <div className={styles.tableHeader}>
            <div className={styles.colName}>Nome</div>
            <div className={styles.colSlug}>Slug</div>
            <div className={styles.colCreated}>Criado em</div>
            <div className={styles.colActions}>Ações</div>
          </div>
          <div className={styles.tableBody}>
            {branches.map(b => (
              <div key={b.id} className={styles.tableRow}>
                <div className={styles.colName} data-label="Nome:">
                  {b.name}
                </div>
                <div className={styles.colSlug} data-label="Slug:">
                  {b.slug}
                </div>
                <div className={styles.colCreated} data-label="Criado em:">
                  {new Date(b.created_at).toLocaleDateString('pt-BR')}
                </div>
                <div className={styles.colActions}>
                  <button
                    className={styles.edit}
                    onClick={() => openEdit(b)}
                  >
                    ✏️
                  </button>
                  <button
                    className={styles.delete}
                    onClick={() => handleDelete(b.id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.cardGrid}>
          {branches.map(b => (
            <div
              key={b.id}
              className={styles.card}
              onClick={() => openEdit(b)}
            >
              <div className={styles.cardHeader}>
                <h3>{b.name}</h3>
              </div>
              <p className={styles.cardSlug}>{b.slug}</p>
              <p className={styles.cardCreated}>
                Criado em {new Date(b.created_at).toLocaleDateString('pt-BR')}
              </p>
              <div className={styles.cardActions}>
                <button className={styles.edit}>✏️ Editar</button>
                <button
                  className={styles.delete}
                  onClick={e => {
                    e.stopPropagation();
                    handleDelete(b.id);
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de ViewMode */}
      <Modal open={viewModalOpen} onClose={() => setViewModalOpen(false)}>
        <div className={styles.viewModeModal}>
          <h2>Modo de visualização</h2>
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

      {/* Modal de CRUD */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <BranchModal
          branch={selected}
          onSave={handleSave}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </main>
  );
}
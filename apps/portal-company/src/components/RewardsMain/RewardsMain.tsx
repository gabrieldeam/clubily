'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/Modal/Modal';
import {
  listRewards,
  createReward,
  updateReward,
  deleteReward,
} from '@/services/companyRewardsService';
import type {
  RewardRead,
  RewardCreate,
} from '@/types/companyReward';
import RewardModal from './RewardModal/RewardModal';
import styles from './RewardsMain.module.css';

export default function RewardsMain() {
  const [items, setItems] = useState<RewardRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<RewardRead | null>(null);

  const fetchItems = () => {
    setLoading(true);
    listRewards()
      .then(res => {
        setItems(res.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(fetchItems, []);

  const openCreate = () => {
    setSelected(null);
    setModalOpen(true);
  };
  const openEdit = (it: RewardRead) => {
    setSelected(it);
    setModalOpen(true);
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta recompensa?')) return;
    await deleteReward(id);
    fetchItems();
  };
  const handleSave = async (data: RewardCreate, id?: string) => {
    if (id) await updateReward(id, data);
    else    await createReward(data);
    setModalOpen(false);
    fetchItems();
  };

  return (
    <main className={styles.main}>
      <div className={styles.topBar}>
        <h2>Recompensas</h2>
        <button className={styles.addBtn} onClick={openCreate}>
          + Nova Recompensa
        </button>
      </div>

      {loading ? (
        <p className={styles.loading}>Carregando recompensas...</p>
      ) : items.length === 0 ? (
        <div className={styles.empty}>
          <h3>Sem recompensas cadastradas</h3>
          <button onClick={openCreate} className={styles.createBtn}>
            Criar primeira recompensa
          </button>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <div className={styles.tableHeader}>
            <div className={styles.colName}>Nome</div>
            <div className={styles.colSecret}>Secreto</div>
            <div className={styles.colStock}>Estoque</div>
            <div className={styles.colActions}>Ações</div>
          </div>
          <div className={styles.tableBody}>
            {items.map(it => (
              <div key={it.id} className={styles.tableRow}>
                <div className={styles.colName} data-label="Nome:">{it.name}</div>
                <div className={styles.colSecret} data-label="Secreto:">
                  {it.secret ? '✅' : '—'}
                </div>
                <div className={styles.colStock} data-label="Estoque:">
                  {it.stock_qty ?? '∞'}
                </div>
                <div className={styles.colActions}>
                  <button className={styles.edit} onClick={() => openEdit(it)}>✏️</button>
                  <button className={styles.delete} onClick={() => handleDelete(it.id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <RewardModal
          reward={selected}
          onSave={handleSave}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </main>
  );
}

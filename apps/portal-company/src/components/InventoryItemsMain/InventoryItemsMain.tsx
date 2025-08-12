'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/Modal/Modal';
import {
  listInventoryItems,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem
} from '@/services/inventoryItemService';
import type { InventoryItemRead, InventoryItemCreate } from '@/types/inventoryItem';
import InventoryItemModal from './InventoryItemModal/InventoryItemModal';
import styles from './InventoryItemsMain.module.css';

export default function InventoryItemsMain() {
  const [items, setItems] = useState<InventoryItemRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<InventoryItemRead | null>(null);

  // view mode
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  /* paginação */
  const [skip, setSkip]   = useState(0);
  const limit             = 10;
  const [total, setTotal] = useState(0);

  // Carrega itens
  const fetchItems = () => {
    setLoading(true);
    listInventoryItems(skip, limit)
      .then(res => {
        setItems(res.data.items);
        setTotal(res.data.total);
      })
      .finally(() => setLoading(false));
  };
  useEffect(fetchItems, [skip]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) setViewMode('card');
  }, [isMobile]);

  const openCreate = () => { setSelected(null); setModalOpen(true); };
  const openEdit = (it: InventoryItemRead) => { setSelected(it); setModalOpen(true); };
  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir este item?')) {
      await deleteInventoryItem(id);
      fetchItems();
    }
  };
  const handleSave = async (data: InventoryItemCreate, id?: string) => {
    if (id) await updateInventoryItem(id, data);
    else await createInventoryItem(data);
    setModalOpen(false);
    fetchItems();
  };

  const canPrev = skip > 0;
  const canNext = skip + limit < total;

  const goPrev = () => { if (canPrev) setSkip(prev => Math.max(prev - limit, 0)); };
  const goNext = () => { if (canNext) setSkip(prev => prev + limit); };

  // agora usamos direto item.categories
  const renderCategoryNames = (it: InventoryItemRead) => {
    const cats = it.categories ?? [];
    if (!cats.length) return '—';
    return cats.map(c => c.name).join(', ');
  };

  return (
    <main className={styles.main}>
      <div className={styles.topBar}>
        <h2>Inventário</h2>
        <div className={styles.actionsHeader}>
          <button className={styles.addBtn} onClick={openCreate}>+ Novo Item</button>
          {!isMobile && (
            <button className={styles.viewToggleBtn} onClick={() => setViewModalOpen(true)}>⋮</button>
          )}
        </div>
      </div>

      {loading ? (
        <p className={styles.loading}>Carregando itens...</p>
      ) : items.length === 0 ? (
        <div className={styles.empty}>
          <h3>Sem itens cadastrados</h3>
          <button onClick={openCreate} className={styles.createBtn}>
            Criar primeiro item
          </button>
        </div>
      ) : viewMode === 'list' ? (
        <div className={styles.tableWrapper}>
          <div className={styles.tableHeader}>
            <div className={styles.colSku}>SKU</div>
            <div className={styles.colName}>Nome</div>
            <div className={styles.colPrice}>Preço</div>
            <div className={styles.colCategories}>Categorias</div>
            <div className={styles.colActions}>Ações</div>
          </div>
          <div className={styles.tableBody}>
            {items.map(it => (
              <div key={it.id} className={styles.tableRow}>
                <div className={styles.colSku} data-label="SKU:">{it.sku}</div>
                <div className={styles.colName} data-label="Nome:">{it.name}</div>
                <div className={styles.colPrice} data-label="Preço:">R$ {Number(it.price).toFixed(2)}</div>
                <div className={styles.colCategories} data-label="Categorias:">
                  {renderCategoryNames(it)}
                </div>
                <div className={styles.colActions}>
                  <button className={styles.edit} onClick={() => openEdit(it)}>✏️</button>
                  <button className={styles.delete} onClick={() => handleDelete(it.id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
          {total > limit && (
            <div className={styles.pagination}>
              <button onClick={goPrev} disabled={!canPrev}>← Anterior</button>
              <span>{Math.floor(skip / limit) + 1} / {Math.ceil(total / limit)}</span>
              <button onClick={goNext} disabled={!canNext}>Próxima →</button>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.cardGrid}>
          {items.map(it => (
            <div key={it.id} className={styles.card} onClick={() => openEdit(it)}>
              <div className={styles.cardHeader}>
                <h3>{it.name}</h3>
                <span className={styles.cardSku}>{it.sku}</span>
              </div>
              <p className={styles.cardPrice}>R$ {Number(it.price).toFixed(2)}</p>
              <p className={styles.cardCategories}>
                {renderCategoryNames(it)}
              </p>
              <div className={styles.cardActions}>
                <button className={styles.edit}>✏️ Editar</button>
                <button
                  className={styles.delete}
                  onClick={e => { e.stopPropagation(); handleDelete(it.id); }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
          {total > limit && (
            <div className={styles.pagination}>
              <button onClick={goPrev} disabled={!canPrev}>← Anterior</button>
              <span>{Math.floor(skip / limit) + 1} / {Math.ceil(total / limit)}</span>
              <button onClick={goNext} disabled={!canNext}>Próxima →</button>
            </div>
          )}
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
        <InventoryItemModal
          item={selected}
          onSave={handleSave}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </main>
  );
}

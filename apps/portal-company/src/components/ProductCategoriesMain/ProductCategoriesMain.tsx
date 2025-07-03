// /components/ProductCategoriesMain/ProductCategoriesMain.tsx
'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/Modal/Modal';
import {
  listProductCategories,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
} from '@/services/productCategoryService';
import type { ProductCategoryRead, ProductCategoryCreate } from '@/types/productCategory';
import CategoryModal from './CategoryModal/CategoryModal';
import styles from './ProductCategoriesMain.module.css';

export default function ProductCategoriesMain() {
  const [categories, setCategories] = useState<ProductCategoryRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<ProductCategoryRead | null>(null);

  // view toggle (list/card)
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  /* paginação */
  const [skip,  setSkip]  = useState(0);   // deslocamento atual
  const limit            = 10;            // itens por página (fixo ou configurável)
  const [total, setTotal] = useState(0);

  const fetchCategories = () => {
    setLoading(true);
    listProductCategories(skip, limit)
      .then(res => {
        setCategories(res.data.items);
        setTotal(res.data.total);
      })
      .finally(() => setLoading(false));
  };

  useEffect(fetchCategories, [skip]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) setViewMode('card');
  }, [isMobile]);

  const openCreate = () => {
    setSelected(null);
    setModalOpen(true);
  };
  const openEdit = (c: ProductCategoryRead) => {
    setSelected(c);
    setModalOpen(true);
  };
  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir esta categoria?')) {
      await deleteProductCategory(id);
      fetchCategories();
    }
  };
  const handleSave = async (data: ProductCategoryCreate, id?: string) => {
    if (id) await updateProductCategory(id, data);
    else await createProductCategory(data);
    setModalOpen(false);
    fetchCategories();
  };

  const canPrev = skip > 0;
  const canNext = skip + limit < total;

  const goPrev = () => { if (canPrev) setSkip(prev => Math.max(prev - limit, 0)); };
  const goNext = () => { if (canNext) setSkip(prev => prev + limit); };


  return (
    <main className={styles.main}>
      <div className={styles.topBar}>
        <h2>Categorias de Produto</h2>
        <div className={styles.actionsHeader}>          
          <button className={styles.addBtn} onClick={openCreate}>
            + Nova Categoria
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
        <p className={styles.loading}>Carregando categorias...</p>
      ) : categories.length === 0 ? (
        <div className={styles.empty}>
          <h3>Sem categorias cadastradas</h3>
          <button onClick={openCreate} className={styles.createBtn}>
            Criar primeira categoria
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
            {categories.map(c => (
              <div key={c.id} className={styles.tableRow}>
                <div className={styles.colName} data-label="Nome:">
                  {c.name}
                </div>
                <div className={styles.colSlug} data-label="Slug:">
                  {c.slug}
                </div>
                <div className={styles.colCreated} data-label="Criado em:">
                  {new Date(c.created_at).toLocaleDateString('pt-BR')}
                </div>
                <div className={styles.colActions}>
                  <button
                    className={styles.edit}
                    onClick={() => openEdit(c)}
                  >
                    ✏️
                  </button>
                  <button
                    className={styles.delete}
                    onClick={() => handleDelete(c.id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
          {total > limit && (
            <div className={styles.pagination}>
              <button onClick={goPrev} disabled={!canPrev}>← Anterior</button>
              <span>
                {Math.floor(skip / limit) + 1} / {Math.ceil(total / limit)}
              </span>
              <button onClick={goNext} disabled={!canNext}>Próxima →</button>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.cardGrid}>
          {categories.map(c => (
            <div
              key={c.id}
              className={styles.card}
              onClick={() => openEdit(c)}
            >
              <div className={styles.cardHeader}>
                <h3>{c.name}</h3>
              </div>
              <p className={styles.cardSlug}>{c.slug}</p>
              <p className={styles.cardCreated}>
                Criado em {new Date(c.created_at).toLocaleDateString('pt-BR')}
              </p>
              <div className={styles.cardActions}>
                <button className={styles.edit}>✏️ Editar</button>
                <button
                  className={styles.delete}
                  onClick={e => {
                    e.stopPropagation();
                    handleDelete(c.id);
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
          {total > limit && (
            <div className={styles.pagination}>
              <button onClick={goPrev} disabled={!canPrev}>← Anterior</button>
              <span>
                {Math.floor(skip / limit) + 1} / {Math.ceil(total / limit)}
              </span>
              <button onClick={goNext} disabled={!canNext}>Próxima →</button>
            </div>
          )}
        </div>
      )}

      {/* View Mode Modal */}
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

      {/* CRUD Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <CategoryModal
          category={selected}
          onSave={handleSave}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </main>
);
}

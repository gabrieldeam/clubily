// src/app/admin/categories/page.tsx
'use client';

import { useEffect, useState, FormEvent } from 'react';
import Image from 'next/image';
import {
  listCategories,
  createCategory,
  updateCategory,
} from '@/services/categoryService';
import type {
  CategoryRead,
  CategoryCreate,
  CategoryUpdate,
} from '@/types/category';
import Modal from '@/components/Modal/Modal';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import styles from './page.module.css';

type ViewMode = 'table' | 'cards';

export default function CategoriesListPage() {
  const [cats, setCats] = useState<CategoryRead[]>([]);
  const [loading, setLoading] = useState(true);
  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';

  // view mode
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // detail modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState<CategoryRead | null>(null);

  // create modal
  const [createOpen, setCreateOpen] = useState(false);
  // edit modal
  const [editOpen, setEditOpen] = useState(false);

  // form state for create/edit
  const [name, setName] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    try {
      const res = await listCategories();
      setCats(res.data);
    } finally {
      setLoading(false);
    }
  }

  function openDetails(cat: CategoryRead) {
    setSelectedCat(cat);
    setModalOpen(true);
  }
  function closeDetails() {
    setModalOpen(false);
    setSelectedCat(null);
  }

  function openCreate() {
    setName('');
    setImageFile(null);
    setError('');
    setCreateOpen(true);
  }
  function closeCreate() {
    setCreateOpen(false);
  }

  function openEdit(cat: CategoryRead) {
    setSelectedCat(cat);
    setName(cat.name);
    setImageFile(null);
    setError('');
    setEditOpen(true);
  }
  function closeEdit() {
    setEditOpen(false);
    setSelectedCat(null);
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!imageFile) {
      setError('Selecione uma imagem.');
      return;
    }
    try {
      const payload: CategoryCreate = { name, image: imageFile };
      await createCategory(payload);
      await fetchCategories();
      closeCreate();
    } catch (error: unknown) {
      interface ErrorResponse { response?: { data?: { detail?: string } } }
      const err = error as ErrorResponse;
      const detail = err.response?.data?.detail ?? 'Erro ao criar.';
      setError(detail);
    }
  }

  async function handleEdit(e: FormEvent) {
    e.preventDefault();
    if (!selectedCat) return;
    try {
      const payload: Partial<CategoryUpdate> = { name };
      if (imageFile) payload.image = imageFile;
      await updateCategory(selectedCat.id, payload as CategoryUpdate);
      await fetchCategories();
      closeEdit();
    } catch (error: unknown) {
      interface ErrorResponse { response?: { data?: { detail?: string } } }
      const err = error as ErrorResponse;
      const detail = err.response?.data?.detail ?? 'Erro ao editar.';
      setError(detail);
    }
  }

  if (loading) return <p>Carregando categorias...</p>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Categorias</h1>
        <div className={styles.actionsHeader}>
          <button className={styles.btnPrimary} onClick={openCreate}>
            Nova Categoria
          </button>
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
        </div>
      </header>

      {/* Tabela ou Cards */}
      {viewMode === 'table' ? (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Imagem</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {cats.map(cat => (
                <tr key={cat.id}>
                  <td data-label="Nome">{cat.name}</td>
                  <td data-label="Imagem">
                    <Image
                      src={`${baseUrl}${cat.image_url ?? ''}`}
                      alt={cat.name}
                      width={50}
                      height={50}
                      className={styles.thumb}
                    />
                  </td>
                  <td data-label="Ações" className={styles.actions}>
                    <button
                      className={styles.btnDetail}
                      onClick={() => openDetails(cat)}
                    >
                      Detalhes
                    </button>
                    <button
                      className={styles.btnPrimary}
                      onClick={() => openEdit(cat)}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.cardsGrid}>
          {cats.map(cat => (
            <div key={cat.id} className={styles.card}>
              {cat.image_url && (
                <Image
                  src={`${baseUrl}${cat.image_url}`}
                  alt={cat.name}
                  width={260}
                  height={140}
                  className={styles.cardLogo}
                />
              )}
              <div className={styles.cardBody}>
                <h2>{cat.name}</h2>
              </div>
              <div className={styles.cardFooter}>
                <button
                  className={styles.btnDetail}
                  onClick={() => openDetails(cat)}
                >
                  Detalhes
                </button>
                <button
                  className={styles.btnPrimary}
                  onClick={() => openEdit(cat)}
                >
                  Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Detalhes */}
      <Modal open={modalOpen} onClose={closeDetails} width={500}>
        {selectedCat && (
          <div className={styles.detail}>
            <h2>{selectedCat.name}</h2>
            {selectedCat.image_url && (
              <Image
                src={`${baseUrl}${selectedCat.image_url}`}
                alt={selectedCat.name}
                width={120}
                height={120}
                className={styles.logo}
              />
            )}
            <section>
              <h3>ID</h3>
              <p>{selectedCat.id}</p>
            </section>
          </div>
        )}
      </Modal>

      {/* Modal Criar */}
      <Modal open={createOpen} onClose={closeCreate} width={500}>
        <div className={styles.detail}>
          <h2>Nova Categoria</h2>
          <form onSubmit={handleCreate} className={styles.form}>
            {error && <p className={styles.error}>{error}</p>}
            <FloatingLabelInput
              id="create-name"
              label="Nome"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
            <label className={styles.fileLabel}>
              Imagem
              <input
                type="file"
                accept="image/*"
                onChange={e => setImageFile(e.target.files?.[0] ?? null)}
                required
              />
            </label>
            {imageFile && (
              <div className={styles.preview}>
                <Image
                  src={URL.createObjectURL(imageFile)}
                  alt="Preview"
                  width={100}
                  height={100}
                  className={styles.thumb}
                  loader={({ src }) => src}
                />
              </div>
            )}
            <div className={styles.formActions}>
              <button type="submit" className={styles.btnPrimary}>
                Criar
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal Editar */}
      <Modal open={editOpen} onClose={closeEdit} width={500}>
        <div className={styles.detail}>
          <h2>Editar Categoria</h2>
          <form onSubmit={handleEdit} className={styles.form}>
            {error && <p className={styles.error}>{error}</p>}
            <FloatingLabelInput
              id="edit-name"
              label="Nome"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
            <label className={styles.fileLabel}>
              Imagem (opcional)
              <input
                type="file"
                accept="image/*"
                onChange={e => setImageFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {(imageFile || selectedCat?.image_url) && (
              <div className={styles.preview}>
                <Image
                  src={
                    imageFile
                      ? URL.createObjectURL(imageFile)
                      : `${baseUrl}${selectedCat?.image_url}`
                  }
                  alt="Preview"
                  width={100}
                  height={100}
                  className={styles.thumb}
                  loader={({ src }) => src}
                />
              </div>
            )}
            <div className={styles.formActions}>
              <button type="submit" className={styles.btnPrimary}>
                Salvar
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}

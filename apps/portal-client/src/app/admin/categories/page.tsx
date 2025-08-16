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

// 👇 picker/cropper 1:1
import ImagePickerSquare from '@/components/ImagePickerSquare/ImagePickerSquare';

type ViewMode = 'table' | 'cards';

export default function CategoriesListPage() {
  const [cats, setCats] = useState<CategoryRead[]>([]);
  const [loading, setLoading] = useState(true);

  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';
  const myLoader = ({ src }: { src: string }) => `${baseUrl}${src}`;

  // view mode
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // detail modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState<CategoryRead | null>(null);

  // create/edit modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // form state for create/edit
  const [name, setName] = useState('');
  const [commission, setCommission] = useState(''); // 👈 string para aceitar vazio (NULL) e vírgula
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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
    setCommission('');     // vazio = null
    setImageFile(null);
    setPreviewUrl(null);
    setError('');
    setCreateOpen(true);
  }
  function closeCreate() {
    setCreateOpen(false);
  }

  function openEdit(cat: CategoryRead) {
    setSelectedCat(cat);
    setName(cat.name);
    setCommission(
      cat.commission_percent !== null && cat.commission_percent !== undefined
        ? String(cat.commission_percent)
        : ''
    );
    setImageFile(null);
    setPreviewUrl(cat.image_url ? `${baseUrl}${cat.image_url}` : null);
    setError('');
    setEditOpen(true);
  }
  function closeEdit() {
    setEditOpen(false);
    setSelectedCat(null);
  }

  // parse seguro pt-BR: aceita vírgula e vazio
  function parseCommissionToNumberOrNull(raw: string): number | null {
    const s = (raw ?? '').trim();
    if (!s) return null;
    const normalized = s.replace(',', '.');
    const n = Number(normalized);
    if (Number.isNaN(n)) throw new Error('Informe um número válido.');
    if (n < 0 || n > 100) throw new Error('O percentual deve estar entre 0 e 100.');
    // arredonda para 2 casas sem quebrar
    return Math.round(n * 100) / 100;
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!imageFile) {
      setError('Selecione uma imagem.');
      return;
    }
    try {
      let commission_percent: number | null = null;
      try {
        commission_percent = parseCommissionToNumberOrNull(commission);
      } catch (err) {
        setError((err as Error).message);
        return;
      }

      const payload: CategoryCreate = {
        name,
        image: imageFile,
        commission_percent, // pode ser null
      };
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
      let commission_percent: number | null = null;
      try {
        commission_percent = parseCommissionToNumberOrNull(commission);
      } catch (err) {
        setError((err as Error).message);
        return;
      }

      const payload: Partial<CategoryUpdate> = {
        name,
        commission_percent, // pode ser null (limpa)
      };
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

  const fmtPct = (v?: number | null) =>
    v === null || v === undefined
      ? '—'
      : `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(v)}%`;

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
                <th>Comissão (%)</th> {/* 👈 novo */}
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {cats.map((cat) => (
                <tr key={cat.id}>
                  <td data-label="Nome">{cat.name}</td>
                  <td data-label="Imagem">
                    {cat.image_url ? (
                      <Image
                        loader={myLoader}
                        src={cat.image_url}
                        alt={cat.name}
                        width={50}
                        height={50}
                        className={styles.thumb}
                      />
                    ) : '—'}
                  </td>
                  <td data-label="Comissão (%)">
                    <span className={styles.badgePct}>{fmtPct(cat.commission_percent)}</span>
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
          {cats.map((cat) => (
            <div key={cat.id} className={styles.card}>
              {cat.image_url && (
                <Image
                  loader={myLoader}
                  src={cat.image_url}
                  alt={cat.name}
                  width={260}
                  height={140}
                  className={styles.cardLogo}
                />
              )}
              <div className={styles.cardBody}>
                <h2>{cat.name}</h2>
                <p className={styles.cardPct}><strong>Comissão:</strong> {fmtPct(cat.commission_percent)}</p>
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
                loader={myLoader}
                src={selectedCat.image_url}
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
            <section>
              <h3>Comissão</h3>
              <p>{fmtPct(selectedCat.commission_percent)}</p>
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
              onChange={(e) => setName(e.target.value)}
              required
            />

            <FloatingLabelInput
              id="create-commission"
              label="Comissão (%) — 0 a 100"
              type="text"
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
              placeholder="ex.: 12,5"
            />

            <ImagePickerSquare
              buttonLabel="Escolher imagem"
              stageSize={360}
              outputSize={512}
              outputFileName="category.jpg"
              outputType="image/jpeg"
              onCropped={(file, dataUrl) => {
                setImageFile(file);
                setPreviewUrl(dataUrl);
              }}
            />

            {previewUrl && (
              <div className={styles.preview}>
                <Image
                  src={previewUrl}
                  alt="Preview"
                  width={100}
                  height={100}
                  className={styles.thumb}
                  loader={({ src }) => src}
                  unoptimized
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
              onChange={(e) => setName(e.target.value)}
              required
            />

            <FloatingLabelInput
              id="edit-commission"
              label="Comissão (%) — 0 a 100"
              type="text"
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
              placeholder="ex.: 12,5"
            />

            <ImagePickerSquare
              buttonLabel="Trocar imagem (opcional)"
              stageSize={360}
              outputSize={512}
              outputFileName="category.jpg"
              outputType="image/jpeg"
              onCropped={(file, dataUrl) => {
                setImageFile(file);
                setPreviewUrl(dataUrl);
              }}
            />

            {(previewUrl || selectedCat?.image_url) && (
              <div className={styles.preview}>
                <Image
                  src={previewUrl ? previewUrl : `${baseUrl}${selectedCat?.image_url}`}
                  alt="Preview"
                  width={100}
                  height={100}
                  className={styles.thumb}
                  loader={({ src }) => src}
                  unoptimized
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

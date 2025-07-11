// src/app/admin/slides/page.tsx
'use client';

import { useCallback, useEffect, useState, FormEvent, ChangeEvent } from 'react';
import Image from 'next/image';
import {
  adminListSlides,
  adminCreateSlide,
  adminUpdateSlide,
  adminDeleteSlide,
} from '@/services/slideService';
import type {
  SlideImageRead,
} from '@/types/slide';
import Modal from '@/components/Modal/Modal';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import styles from './page.module.css';

type ViewMode = 'table' | 'cards';

export default function SlidesListPage() {
  const [slides, setSlides] = useState<SlideImageRead[]>([]);
  const [loading, setLoading] = useState(true);
  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';

  const [viewMode, setViewMode] = useState<ViewMode>('table');

  /* Detail modal */
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedSlide, setSelectedSlide] = useState<SlideImageRead | null>(null);

  /* Create / Edit modals */
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  /* Form state */
  const [title, setTitle] = useState('');
  const [order, setOrder] = useState(0);
  const [active, setActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  /* --- Fetch slides (memoised) --- */
  const fetchSlides = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminListSlides(0, 100);
      setSlides(res.data.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSlides(); }, [fetchSlides]);

  /* ---------- Handlers ---------- */
  function openDetail(s: SlideImageRead) {
    setSelectedSlide(s);
    setDetailOpen(true);
  }
  function closeDetail() {
    setDetailOpen(false);
    setSelectedSlide(null);
  }

  function openCreate() {
    setTitle('');
    setOrder(0);
    setActive(true);
    setImageFile(null);
    setError('');
    setCreateOpen(true);
  }
  function closeCreate() { setCreateOpen(false); }

  function openEdit(s: SlideImageRead) {
    setSelectedSlide(s);
    setTitle(s.title);
    setOrder(s.order);
    setActive(s.active);
    setImageFile(null);
    setError('');
    setEditOpen(true);
  }
  function closeEdit() {
    setEditOpen(false);
    setSelectedSlide(null);
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!imageFile) {
      setError('Selecione uma imagem.');
      return;
    }
    try {
      await adminCreateSlide({ title, order, active, image: imageFile });
      await fetchSlides();
      closeCreate();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro ao criar slide.';
      setError(msg);
    }
  }

  async function handleEdit(e: FormEvent) {
    e.preventDefault();
    if (!selectedSlide) return;
    try {
      await adminUpdateSlide(selectedSlide.id, { title, order, active, image: imageFile ?? undefined });
      await fetchSlides();
      closeEdit();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro ao editar slide.';
      setError(msg);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente excluir este slide?')) return;
    await adminDeleteSlide(id);
    fetchSlides();
  }

  if (loading) return <p>Carregando slides…</p>;

  /* ---------- Render ---------- */
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Slides</h1>
        <div className={styles.actionsHeader}>
          <button className={styles.btnPrimary} onClick={openCreate}>Novo Slide</button>
          <div className={styles.viewToggle}>
            <button className={viewMode === 'table' ? styles.activeToggle : ''} onClick={() => setViewMode('table')}>Tabela</button>
            <button className={viewMode === 'cards' ? styles.activeToggle : ''} onClick={() => setViewMode('cards')}>Cards</button>
          </div>
        </div>
      </header>

      {/* ---------- Listagem ---------- */}
      {viewMode === 'table' ? (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr><th>Título</th><th>Ordem</th><th>Ativo</th><th>Imagem</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {slides.map(s => (
                <tr key={s.id}>
                  <td data-label="Título">{s.title}</td>
                  <td data-label="Ordem">{s.order}</td>
                  <td data-label="Ativo">{s.active ? 'Sim' : 'Não'}</td>
                  <td data-label="Imagem">
                    <Image
                      loader={({ src }) => src}
                      src={`${baseUrl}${s.image_url}`}
                      alt={s.title}
                      width={50}
                      height={50}
                      className={styles.thumb}
                    />
                  </td>
                  <td data-label="Ações" className={styles.actions}>
                    <button className={styles.btnDetail} onClick={() => openDetail(s)}>Detalhes</button>
                    <button className={styles.btnPrimary} onClick={() => openEdit(s)}>Editar</button>
                    <button className={styles.btnDetail} onClick={() => handleDelete(s.id)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.cardsGrid}>
          {slides.map(s => (
            <div key={s.id} className={styles.card}>
              <Image
                loader={({ src }) => src}
                src={`${baseUrl}${s.image_url}`}
                alt={s.title}
                width={260}
                height={140}
                className={styles.cardLogo}
              />
              <div className={styles.cardBody}>
                <h2>{s.title}</h2>
                <p>Ordem: {s.order}</p>
                <p>Ativo: {s.active ? 'Sim' : 'Não'}</p>
              </div>
              <div className={styles.cardFooter}>
                <button className={styles.btnDetail} onClick={() => openDetail(s)}>Detalhes</button>
                <button className={styles.btnPrimary} onClick={() => openEdit(s)}>Editar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---------- Modal Detalhes ---------- */}
      <Modal open={detailOpen} onClose={closeDetail} width={500}>
        {selectedSlide && (
          <div className={styles.detail}>
            <h2>{selectedSlide.title}</h2>
            <Image
              loader={({ src }) => src}
              src={`${baseUrl}${selectedSlide.image_url}`}
              alt={selectedSlide.title}
              width={200}
              height={200}
              className={styles.logo}
            />
            <section><h3>ID</h3><p>{selectedSlide.id}</p></section>
            <section><h3>Ordem</h3><p>{selectedSlide.order}</p></section>
            <section><h3>Ativo</h3><p>{selectedSlide.active ? 'Sim' : 'Não'}</p></section>
          </div>
        )}
      </Modal>

      {/* ---------- Modal Criar ---------- */}
      <Modal open={createOpen} onClose={closeCreate} width={500}>
        <div className={styles.detail}>
          <h2>Novo Slide</h2>
          <form onSubmit={handleCreate} className={styles.form}>
            {error && <p className={styles.error}>{error}</p>}
            <FloatingLabelInput label="Título" value={title} onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} required />
            <FloatingLabelInput label="Ordem" type="number" value={order.toString()} onChange={e => setOrder(Number(e.target.value))} />
            <label className={styles.switchLabel}>
              <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Ativo
            </label>
            <label className={styles.fileLabel}>
              Imagem
              <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] ?? null)} required />
            </label>
            {imageFile && (
              <Image
                loader={({ src }) => src}
                src={URL.createObjectURL(imageFile)}
                alt="Preview"
                width={120}
                height={120}
                className={styles.thumb}
              />
            )}
            <div className={styles.formActions}>
              <button type="submit" className={styles.btnPrimary}>Criar</button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ---------- Modal Editar ---------- */}
      <Modal open={editOpen} onClose={closeEdit} width={500}>
        <div className={styles.detail}>
          <h2>Editar Slide</h2>
          <form onSubmit={handleEdit} className={styles.form}>
            {error && <p className={styles.error}>{error}</p>}
            <FloatingLabelInput label="Título" value={title} onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} required />
            <FloatingLabelInput label="Ordem" type="number" value={order.toString()} onChange={e => setOrder(Number(e.target.value))} />
            <label className={styles.switchLabel}>
              <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Ativo
            </label>
            <label className={styles.fileLabel}>
              Imagem (opcional)
              <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] ?? null)} />
            </label>
            {(imageFile || selectedSlide?.image_url) && (
              <Image
                loader={({ src }) => src}
                src={imageFile ? URL.createObjectURL(imageFile) : `${baseUrl}${selectedSlide!.image_url}`}
                alt="Preview"
                width={120}
                height={120}
                className={styles.thumb}
              />
            )}
            <div className={styles.formActions}>
              <button type="submit" className={styles.btnPrimary}>Salvar</button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}

// src/app/admin/milestones/page.tsx
'use client';

import { useCallback, useEffect, useState, FormEvent, ChangeEvent } from 'react';
import Image from 'next/image';
import {
  adminListMilestones,
  adminCreateMilestone,
  adminUpdateMilestone,
  adminDeleteMilestone,
} from '@/services/milestoneService';
import type { MilestoneRead } from '@/types/milestone';

import Modal from '@/components/Modal/Modal';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import styles from './page.module.css';

type ViewMode = 'table' | 'cards';

export default function MilestonesListPage() {
  /* ---------- State ---------- */
  const [milestones, setMilestones] = useState<MilestoneRead[]>([]);
  const [loading, setLoading] = useState(true);
  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';

  const [viewMode, setViewMode] = useState<ViewMode>('table');

  /* Detail modal */
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<MilestoneRead | null>(null);

  /* Create / Edit modals */
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  /* Form state */
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState(0);
  const [order, setOrder] = useState(0);
  const [active, setActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  /* ---------- Fetch ---------- */
  const fetchMilestones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminListMilestones(0, 100);
      setMilestones(res.data.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMilestones(); }, [fetchMilestones]);

  /* ---------- Handlers ---------- */
  function openDetail(m: MilestoneRead) {
    setSelected(m);
    setDetailOpen(true);
  }
  function closeDetail()          { setDetailOpen(false); setSelected(null); }

  function openCreate() {
    setTitle(''); setDescription(''); setPoints(0); setOrder(0); setActive(true);
    setImageFile(null); setError('');
    setCreateOpen(true);
  }
  function closeCreate()          { setCreateOpen(false); }

  function openEdit(m: MilestoneRead) {
    setSelected(m);
    setTitle(m.title); setDescription(m.description ?? '');
    setPoints(m.points); setOrder(m.order ?? 0); setActive(m.active ?? true);
    setImageFile(null); setError('');
    setEditOpen(true);
  }
  function closeEdit()            { setEditOpen(false); setSelected(null); }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!imageFile) { setError('Selecione uma imagem.'); return; }
    try {
      await adminCreateMilestone(
        { title, description, points, order, active },
        imageFile,
      );
      await fetchMilestones(); closeCreate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar marco.');
    }
  }

  async function handleEdit(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    try {
      await adminUpdateMilestone(
        selected.id,
        { title, description, points, order, active },
        imageFile ?? undefined,
      );
      await fetchMilestones(); closeEdit();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao editar marco.');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente excluir este marco?')) return;
    await adminDeleteMilestone(id);
    fetchMilestones();
  }

  if (loading) return <p>Carregando marcos…</p>;

  /* ---------- Render ---------- */
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Marcos</h1>
        <div className={styles.actionsHeader}>
          <button className={styles.btnPrimary} onClick={openCreate}>Novo Marco</button>
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
              <tr>
                <th>Título</th><th>Pontos</th><th>Ordem</th><th>Ativo</th><th>Imagem</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {milestones.map(m => (
                <tr key={m.id}>
                  <td data-label="Título">{m.title}</td>
                  <td data-label="Pontos">{m.points}</td>
                  <td data-label="Ordem">{m.order}</td>
                  <td data-label="Ativo">{m.active ? 'Sim' : 'Não'}</td>
                  <td data-label="Imagem">
                    <Image loader={({ src }) => src} src={`${baseUrl}${m.image_url}`}
                      alt={m.title} width={50} height={50} className={styles.thumb} />
                  </td>
                  <td data-label="Ações" className={styles.actions}>
                    <button className={styles.btnDetail}  onClick={() => openDetail(m)}>Detalhes</button>
                    <button className={styles.btnPrimary} onClick={() => openEdit(m)}>Editar</button>
                    <button className={styles.btnDetail}  onClick={() => handleDelete(m.id)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.cardsGrid}>
          {milestones.map(m => (
            <div key={m.id} className={styles.card}>
              <Image loader={({ src }) => src} src={`${baseUrl}${m.image_url}`}
                alt={m.title} width={260} height={140} className={styles.cardLogo} />
              <div className={styles.cardBody}>
                <h2>{m.title}</h2>
                <p>{m.description}</p>
                <p>Pontos: {m.points}</p>
                <p>Ordem: {m.order}</p>
                <p>Ativo: {m.active ? 'Sim' : 'Não'}</p>
              </div>
              <div className={styles.cardFooter}>
                <button className={styles.btnDetail}  onClick={() => openDetail(m)}>Detalhes</button>
                <button className={styles.btnPrimary} onClick={() => openEdit(m)}>Editar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---------- Modal Detalhes ---------- */}
      <Modal open={detailOpen} onClose={closeDetail} width={500}>
        {selected && (
          <div className={styles.detail}>
            <h2>{selected.title}</h2>
            <Image loader={({ src }) => src} src={`${baseUrl}${selected.image_url}`}
              alt={selected.title} width={200} height={200} className={styles.logo} />
            <section><h3>ID</h3><p>{selected.id}</p></section>
            <section><h3>Descrição</h3><p>{selected.description}</p></section>
            <section><h3>Pontos</h3><p>{selected.points}</p></section>
            <section><h3>Ordem</h3><p>{selected.order}</p></section>
            <section><h3>Ativo</h3><p>{selected.active ? 'Sim' : 'Não'}</p></section>
          </div>
        )}
      </Modal>

      {/* ---------- Modal Criar ---------- */}
      <Modal open={createOpen} onClose={closeCreate} width={500}>
        <div className={styles.detail}>
          <h2>Novo Marco</h2>
          <form onSubmit={handleCreate} className={styles.form}>
            {error && <p className={styles.error}>{error}</p>}
            <FloatingLabelInput label="Título" value={title}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} required />
            <FloatingLabelInput label="Descrição" value={description}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)} />
            <FloatingLabelInput label="Pontos" type="number" value={points.toString()}
              onChange={e => setPoints(Number(e.target.value))} required />
            <FloatingLabelInput label="Ordem" type="number" value={order.toString()}
              onChange={e => setOrder(Number(e.target.value))} />
            <label className={styles.switchLabel}>
              <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Ativo
            </label>
            <label className={styles.fileLabel}>
              Imagem
              <input type="file" accept="image/*"
                onChange={e => setImageFile(e.target.files?.[0] ?? null)} required />
            </label>
            {imageFile && (
              <Image loader={({ src }) => src} src={URL.createObjectURL(imageFile)}
                alt="Preview" width={120} height={120} className={styles.thumb} />
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
          <h2>Editar Marco</h2>
          <form onSubmit={handleEdit} className={styles.form}>
            {error && <p className={styles.error}>{error}</p>}
            <FloatingLabelInput label="Título" value={title}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} required />
            <FloatingLabelInput label="Descrição" value={description}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)} />
            <FloatingLabelInput label="Pontos" type="number" value={points.toString()}
              onChange={e => setPoints(Number(e.target.value))} required />
            <FloatingLabelInput label="Ordem" type="number" value={order.toString()}
              onChange={e => setOrder(Number(e.target.value))} />
            <label className={styles.switchLabel}>
              <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Ativo
            </label>
            <label className={styles.fileLabel}>
              Imagem (opcional)
              <input type="file" accept="image/*"
                onChange={e => setImageFile(e.target.files?.[0] ?? null)} />
            </label>
            {(imageFile || selected?.image_url) && (
              <Image loader={({ src }) => src}
                src={imageFile ? URL.createObjectURL(imageFile) : `${baseUrl}${selected!.image_url}`}
                alt="Preview" width={120} height={120} className={styles.thumb} />
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

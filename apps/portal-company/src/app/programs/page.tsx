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
    if (id) {
      await updateCashbackProgram(id, data);
    } else {
      await createCashbackProgram(data);
    }
    setModalOpen(false);
    fetchPrograms();
  };

  return (
    <div className={styles.container}>
      <Header onSearch={() => {}} />
      <main className={styles.main}>
        <div className={styles.topBar}>
          <h1>Programas de Cashback</h1>
          <button className={styles.createBtn} onClick={openCreate}>
            + Novo Programa
          </button>
        </div>

        <div className={styles.summary}>
          <div>Total: <strong>{total}</strong></div>
          <div>Ativos: <strong>{active}</strong></div>
          <div>Visíveis: <strong>{visible}</strong></div>
        </div>

        {loading ? (
          <p>Carregando programas...</p>
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
        ) : (
          <ul className={styles.list}>
            {programs.map(p => (
              <li key={p.id} className={styles.item}>
                <div className={styles.info}>
                  <h3>{p.description}</h3>
                  <p>Percentual: {p.percent}%</p>
                  <p>Validade: {p.validity_days} dia{p.validity_days > 1 ? 's' : ''}</p>
                </div>
                <div className={styles.actions}>
                  <button onClick={() => openEdit(p)}>Editar</button>
                  <button onClick={() => handleDelete(p.id)}>Excluir</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <CashbackProgramModal
          program={selected}
          onSave={handleSave}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

// src/components/PointsRulesMain/PointsRulesMain.tsx
'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/Modal/Modal';
import {
  listPointsRules,
  createPointsRule,
  updatePointsRule,
  deletePointsRule,
} from '@/services/pointsService';
import type { PointsRuleRead, PointsRuleCreate } from '@/types/points';
import PointsRuleModal from './PointsRuleModal/PointsRuleModal';
import styles from './PointsRulesMain.module.css';

export default function PointsRulesMain() {
  const [rules, setRules] = useState<PointsRuleRead[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<PointsRuleRead | null>(null);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = () => {
    setLoading(true);
    listPointsRules()
      .then(res => setRules(res.data))
      .finally(() => setLoading(false));
  };

  const openCreate = () => {
    setSelectedRule(null);
    setModalOpen(true);
  };

  const openEdit = (rule: PointsRuleRead) => {
    setSelectedRule(rule);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir esta regra?')) {
      await deletePointsRule(id);
      fetchRules();
    }
  };

  const handleSave = async (data: PointsRuleCreate, id?: string) => {
    if (id) await updatePointsRule(id, data);
    else await createPointsRule(data);
    setModalOpen(false);
    fetchRules();
  };

  return (
    <>
      <main className={styles.main}>
        <div className={styles.topBar}>
          <h2>Regras de Pontos</h2>
          <button className={styles.addBtn} onClick={openCreate}>
            + Nova Regra
          </button>
        </div>

        {loading ? (
          <p className={styles.loading}>Carregando regras...</p>
        ) : rules.length === 0 ? (
          <div className={styles.empty}>
            <h2>Nenhuma regra criada</h2>
            <button className={styles.createBtn} onClick={openCreate}>
              Criar Regra
            </button>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <div className={styles.tableHeader}>
              <div>Nome</div>
              <div>Tipo</div>
              <div>Ativa</div>
              <div>Visível</div>
              <div>Ações</div>
            </div>
            <div className={styles.tableBody}>
              {rules.map(r => (
                <div key={r.id} className={styles.tableRow}>
                  <div>{r.name}</div>
                  <div>{r.rule_type}</div>
                  <div>{r.active ? 'Sim' : 'Não'}</div>
                  <div>{r.visible ? 'Sim' : 'Não'}</div>
                  <div className={styles.actions}>
                    <button onClick={() => openEdit(r)}>✏️</button>
                    <button onClick={() => handleDelete(r.id)}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
          <PointsRuleModal
            rule={selectedRule}
            onSave={handleSave}
            onCancel={() => setModalOpen(false)}
          />
        </Modal>
      </main>
    </>
  );
}

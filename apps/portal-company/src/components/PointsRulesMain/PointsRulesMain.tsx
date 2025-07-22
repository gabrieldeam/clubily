// src/components/PointsRulesMain/PointsRulesMain.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { isAxiosError } from 'axios';
import Modal from '@/components/Modal/Modal';
import Notification from '@/components/Notification/Notification';
import {
  listPointsRules,
  createPointsRule,
  updatePointsRule,
  deletePointsRule,
} from '@/services/pointsService';
import { RuleType } from '@/types/points';
import type { PointsRuleRead, PointsRuleCreate } from '@/types/points';
import PointsRuleModal from './PointsRuleModal/PointsRuleModal';
import { getRuleTypeLabel } from '@/utils/roleUtils';
import styles from './PointsRulesMain.module.css';

export default function PointsRulesMain() {
  const [rules, setRules] = useState<PointsRuleRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<PointsRuleRead | null>(null);

  // view mode
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

const handleCopyLink = (rule: PointsRuleRead) => {
  const slug = (rule.config as any).slug;
  if (!slug) {
    setError('Slug não configurado para esta regra.');
    return;
  }
  const url = `${process.env.NEXT_PUBLIC_PUBLIC_FRONT_BASE_URL}/c/${slug}`;
  navigator.clipboard.writeText(url)
    .then(() => {
      setSuccessMessage(`Link copiado: ${url}`);
    })
    .catch(() => {
      setError('Falha ao copiar o link.');
    });
};


  /* ------------------------- initial fetch & resize ------------------------ */
  useEffect(() => {
    fetchRules();
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) setViewMode('card');
  }, [isMobile]);

  /* ------------------------------ FETCH LIST ------------------------------ */
  const fetchRules = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listPointsRules();
      setRules(res.data);
    } catch (err) {
      const detail = isAxiosError(err)
        ? err.response?.data?.detail
        : undefined;
      setError(detail || 'Erro ao carregar regras');
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------- helpers ------------------------------- */
  const openCreate = () => {
    setError(null);
    setSelectedRule(null);
    setModalOpen(true);
  };

  const openEdit = (rule: PointsRuleRead) => {
    setError(null);
    setSelectedRule(rule);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta regra?')) return;
    setError(null);
    try {
      await deletePointsRule(id);
      await fetchRules();
    } catch (err) {
      const detail = isAxiosError(err)
        ? err.response?.data?.detail
        : undefined;
      setError(detail || 'Erro ao excluir regra');
    }
  };

  const handleSave = async (data: PointsRuleCreate, id?: string) => {
    setError(null);
    try {
      if (id) await updatePointsRule(id, data);
      else await createPointsRule(data);
      setModalOpen(false);
      await fetchRules();
    } catch (err) {
      const detail = isAxiosError(err)
        ? err.response?.data?.detail
        : undefined;
      setError(detail || 'Erro ao salvar regra');
    }
  };

  /* --------------------------- summary counters --------------------------- */
  const total = rules.length;
  const activeCount = rules.filter(r => r.active).length;
  const visibleCount = rules.filter(r => r.visible).length;

  /* -------------------------------- JSX -------------------------------- */
  return (
    <>
      <main className={styles.main}>
        {/* -------- top bar -------- */}
        <div className={styles.topBar}>
          <div className={styles.summary}>
            <h2>Regras de Pontos</h2>
            {!isMobile && (
              <>
                <div>
                  Total <strong>{total}</strong>
                </div>
                <div>
                  Ativos <strong>{activeCount}</strong>
                </div>
                <div>
                  Visíveis <strong>{visibleCount}</strong>
                </div>
              </>
            )}
          </div>

          {error && (
            <Notification
              type="error"
              message={error}
              onClose={() => setError(null)}
            />
          )}

          {successMessage && (
            <Notification
              type="success"
              message={successMessage}
              onClose={() => setSuccessMessage(null)}
            />
          )}

          <div className={styles.actionsHeader}>
            <button className={styles.addBtn} onClick={openCreate}>
              + Nova Regra
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

        {/* -------- body -------- */}
        {loading ? (
          <p className={styles.loading}>Carregando regras...</p>
        ) : rules.length === 0 ? (
          <div className={styles.empty}>
            <h2>Nenhuma regra criada ainda</h2>
            <p>
              Crie sua primeira regra de pontuação para começar a fidelizar seus
              clientes!
            </p>
            <button className={styles.createBtn} onClick={openCreate}>
              Criar Regra
            </button>
          </div>
        ) : viewMode === 'list' ? (
          /* -------- table view -------- */
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
                  <div>{getRuleTypeLabel(r.rule_type)}</div>
                  <div>{r.active ? 'Sim' : 'Não'}</div>
                  <div>{r.visible ? 'Sim' : 'Não'}</div>
                  <div className={styles.actions}>
                    {r.rule_type === RuleType.digital_behavior && (
                      <button
                        className={styles.copyLink}
                        onClick={() => handleCopyLink(r)}
                        title="Copiar link de digital behavior"
                      >
                        🔗
                      </button>
                    )}
                    <Link
                      href={`/programs/rules/${r.id}/${r.name}`}
                      className={styles.view}
                    >
                      🔍
                    </Link>
                    <button
                      className={styles.edit}
                      onClick={() => openEdit(r)}
                    >
                      ✏️
                    </button>
                    <button
                      className={styles.delete}
                      onClick={() => handleDelete(r.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* -------- card view -------- */
          <div className={styles.cardGrid}>
            {rules.map(r => (
              <div
                key={r.id}
                className={styles.card}
                onClick={() => openEdit(r)}
              >
                <div className={styles.cardHeader}>
                  <h3>{r.name}</h3>
                  <span className={styles.cardBadge}>
                    {getRuleTypeLabel(r.rule_type)}
                  </span>
                </div>
                <div className={styles.cardBody}>
                  <p>
                    <strong>Ativa:</strong> {r.active ? 'Sim' : 'Não'}
                  </p>
                  <p>
                    <strong>Visível:</strong> {r.visible ? 'Sim' : 'Não'}
                  </p>
                </div>
                <div className={styles.cardActions}>
                {r.rule_type === RuleType.digital_behavior && (
                    <button
                      className={styles.copyLink}
                      onClick={e => {
                        e.stopPropagation();
                        handleCopyLink(r);
                      }}
                      title="Copiar link de digital behavior"
                    >
                      🔗 Copiar Link
                    </button>
                  )}
                  <Link
                    href={`/programs/rules/${r.id}/${r.name}`}
                    className={styles.view}
                  >
                    🔍 Ver
                  </Link>
                  <button className={styles.edit}>✏️ Editar</button>
                  <button
                    className={styles.delete}
                    onClick={e => {
                      e.stopPropagation();
                      handleDelete(r.id);
                    }}
                  >
                    🗑️ Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* -------- view-mode modal -------- */}
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

        {/* -------- CRUD modal -------- */}
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

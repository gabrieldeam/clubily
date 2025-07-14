'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { isAxiosError } from 'axios';

import Modal from '@/components/Modal/Modal';
import Notification from '@/components/Notification/Notification';

import {
  adminListTemplates,
  adminCreateTemplate,
  adminUpdateTemplate,
  adminDeleteTemplate,
} from '@/services/loyaltyService';

import type {
  TemplateRead,
  TemplateCreate,
  TemplateUpdate,
} from '@/types/loyalty';

import LoyaltyTemplateModal from './LoyaltyTemplateModal/LoyaltyTemplateModal';
import LoyaltyRuleModal from './LoyaltyRuleModal/LoyaltyRuleModal';
import TemplateRewardModal from './TemplateRewardModal/TemplateRewardModal';
import styles from './LoyaltyTemplatesMain.module.css';

// Normaliza diferentes formatos de erro em string legível
function parseErrorDetail(detail: unknown): string {
  if (typeof detail === 'string') {
    return detail;
  }
  if (Array.isArray(detail)) {
    return detail
      .map(item => (item as any).msg || JSON.stringify(item))
      .join('; ');
  }
  if (detail && typeof detail === 'object') {
    if ('errors' in detail && Array.isArray((detail as any).errors)) {
      return (detail as any).errors.map((e: any) => e.message).join('; ');
    }
    return JSON.stringify(detail);
  }
  return 'Ocorreu um erro desconhecido';
}

export default function LoyaltyTemplatesMain() {
  const [templates, setTemplates] = useState<TemplateRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tplModalOpen, setTplModalOpen] = useState(false);
  const [selectedTpl, setSelectedTpl] = useState<TemplateRead | null>(null);

  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [currentTplId, setCurrentTplId] = useState<string>();
  const [rewardModalOpen, setRewardModalOpen] = useState(false);

  useEffect(() => { fetchTemplates(); }, []);

  async function fetchTemplates() {
    setLoading(true);
    setError(null);
    try {
      const res = await adminListTemplates();
      setTemplates(res.data);
    } catch (err) {
      const detail = isAxiosError(err)
        ? err.response?.data?.detail
        : undefined;
      setError(
        detail
          ? parseErrorDetail(detail)
          : 'Erro ao carregar cartões'
      );
    } finally {
      setLoading(false);
    }
  }

  function openCreateTpl() {
    setSelectedTpl(null);
    setTplModalOpen(true);
  }

  function openEditTpl(tpl: TemplateRead) {
    setSelectedTpl(tpl);
    setTplModalOpen(true);
  }

  async function handleSaveTpl(
    data: TemplateCreate | TemplateUpdate,
    iconFile?: File,
    id?: string
  ) {
    setError(null);
    try {
      if (id) {
        await adminUpdateTemplate(id, data as TemplateUpdate, iconFile);
      } else {
        await adminCreateTemplate(data as TemplateCreate, iconFile);
      }
      setTplModalOpen(false);
      await fetchTemplates();
    } catch (err) {
      const detail = isAxiosError(err)
        ? err.response?.data?.detail
        : undefined;
      setError(
        detail
          ? parseErrorDetail(detail)
          : 'Erro ao salvar cartão'
      );
    }
  }

  async function handleDeleteTpl(id: string) {
    if (!confirm('Confirma exclusão deste template?')) return;
    try {
      await adminDeleteTemplate(id);
      await fetchTemplates();
    } catch (err) {
      alert('Falha ao excluir: ' + (err as any).message);
    }
  }
  
  function openAddRule(tplId: string) {
    setCurrentTplId(tplId);
    setRuleModalOpen(true);
  }
  
  function openAddReward(tplId: string) {
    setCurrentTplId(tplId);
    setRewardModalOpen(true);
  }

  return (
    <main className={styles.main}>
      <div className={styles.topBar}>
        <h2>Cartões de Fidelidade</h2>
        <button className={styles.addBtn} onClick={openCreateTpl}>
          + Novo Cartão
        </button>
      </div>

      {error && (
        <Notification
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {loading ? (
        <p className={styles.loading}>Carregando...</p>
      ) : templates.length === 0 ? (
        <div className={styles.empty}>
          <h3>Nenhum cartão criado</h3>
          <button className={styles.createBtn} onClick={openCreateTpl}>
            Criar Cartão
          </button>
        </div>
      ) : (
        <div className={styles.cardGrid}>
          {templates.map(tpl => (
            <div key={tpl.id} className={styles.card}>
              <header
                className={styles.cardHeader}
                style={{ background: tpl.color_primary || '#f3f4f6' }}
              >
                <h3>{tpl.title}</h3>
              </header>
              <div className={styles.cardBody}>
                <p>{tpl.promo_text}</p>
                <p><strong>Carimbos:</strong> {tpl.stamp_total}</p>
              </div>
              <footer className={styles.cardFooter}>
                <div className={styles.actions}>
                    <Link
                      href={`/programs/templates/${tpl.id}/${tpl.title}`}
                      className={styles.view}
                      title="Ver detalhes"
                    >
                      🔍
                    </Link>
                    <button
                      className={styles.edit}
                      onClick={() => openEditTpl(tpl)}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      className={styles.delete}
                      onClick={() => handleDeleteTpl(tpl.id)}
                      title="Excluir"
                    >
                      🗑️
                    </button>
                </div>
                <button
                  className={styles.ruleBtn}
                  onClick={() => openAddRule(tpl.id)}
                >
                  + Regra
                </button>
                <button
                  className={styles.rewardBtn}
                  onClick={() => openAddReward(tpl.id)}
                >
                  + Recompensa
                </button>
              </footer>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Template */}
      <Modal open={tplModalOpen} onClose={() => setTplModalOpen(false)}>
        <LoyaltyTemplateModal
          template={selectedTpl}
          onSave={handleSaveTpl}
          onCancel={() => setTplModalOpen(false)}
        />
      </Modal>

      {/* Modal de Regra */}
      <Modal open={ruleModalOpen} onClose={() => setRuleModalOpen(false)}>
        {currentTplId && (
          <LoyaltyRuleModal
            tplId={currentTplId}
            onClose={() => setRuleModalOpen(false)}
          />
        )}
      </Modal>

      {/* Modal de Recompensa */}
      <Modal open={rewardModalOpen} onClose={() => setRewardModalOpen(false)}>
        {currentTplId && (
          <TemplateRewardModal
            tplId={currentTplId}
            onClose={() => setRewardModalOpen(false)}
          />
        )}
      </Modal>
    </main>
  );
}

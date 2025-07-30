// src/components/LoyaltyRuleModal/LoyaltyRuleModal.tsx
'use client';

import React, { useEffect, useState, FormEvent, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import Button from '@/components/Button/Button';
import Notification from '@/components/Notification/Notification';

import { listInventoryItems } from '@/services/inventoryItemService';
import { listProductCategories } from '@/services/productCategoryService';
import {
  adminListRules,
  adminAddRule,
  adminUpdateRule,
  adminDeleteRule
} from '@/services/loyaltyService';

import type { RuleCreate, RuleRead } from '@/types/loyalty';
import type { InventoryItemRead } from '@/types/inventoryItem';
import type { ProductCategoryRead } from '@/types/productCategory';

import styles from './LoyaltyRuleModal.module.css';

interface Props {
  tplId: string;
  onClose: () => void;
}

const ALL_TYPES = [
  { value: 'purchase_amount', label: 'Valor gasto' },
  { value: 'visit',           label: 'Visitas necessárias' },
  //{ value: 'service_done',    label: 'Serviço executado' },
  { value: 'product_bought',  label: 'Produto comprado' },
  { value: 'category_bought', label: 'Categoria comprada' },
  //{ value: 'custom_event',    label: 'Evento customizado' },
];

type RawConfig =
  | { amount: number }
  | { visits?: number }
  | { service_id: string }
  | { product_ids?: string[] }
  | { category_ids?: string[] }
  | { event_name: string }
  | Record<string, unknown>;

/* helper para texto amigável */
function getConfigText(
  ruleType: string,
  config: RawConfig,
  items: InventoryItemRead[],
  cats: ProductCategoryRead[]
): string {
  switch (ruleType) {
    case 'purchase_amount': {
      const cfg = config as { amount: number };
      return `Ganhe um carimbo para compras a partir de R$ ${cfg.amount}`;
    }

    case 'visit': {
      const cfg = config as { visits?: number };
      const v = cfg.visits ?? 1;
      return `Ganhe um carimbo a cada ${v} visita${v > 1 ? 's' : ''}`;
    }

    case 'service_done': {
      const cfg = config as { service_id: string };
      return `Ganhe um carimbo ao realizar o serviço de ID ${cfg.service_id}`;
    }

    case 'product_bought': {
      const cfg = config as { product_ids?: string[] };
      const names = (cfg.product_ids ?? [])
        .map(id => items.find(i => i.id === id)?.name)
        .filter(Boolean)
        .join(', ');
      return (
        names ||
        'Ganhe um carimbo na compra de produto(s) selecionado(s)'
      );
    }

    case 'category_bought': {
      const cfg = config as { category_ids?: string[] };
      const names = (cfg.category_ids ?? [])
        .map(id => cats.find(c => c.id === id)?.name)
        .filter(Boolean)
        .join(', ');
      return (
        names ||
        'Ganhe um carimbo na compra em categoria(s) selecionada(s)'
      );
    }

    case 'custom_event': {
      const cfg = config as { event_name: string };
      return `Ganhe um carimbo ao disparar o evento “${cfg.event_name}”`;
    }

    default:
      return JSON.stringify(config);
  }
}

export default function LoyaltyRuleModal({ tplId, onClose }: Props) {
  const router = useRouter();

  /* constantes e estado */
  const MAX_RULES = 2;

  const [rules, setRules] = useState<RuleRead[]>([]);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [formState, setFormState] = useState<RuleCreate>({
    rule_type: 'purchase_amount',
    config: {},
    order: 0,
    active: true,
  });

  const canAdd = rules.length < MAX_RULES || editingRuleId !== null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* inventário (produtos) */
  const [items, setItems] = useState<InventoryItemRead[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemTotal, setItemTotal] = useState(0);
  const [itemSkip, setItemSkip] = useState(0);
  const itemLimit = 100;
  const hasPrevItems = itemSkip > 0;
  const hasNextItems = itemSkip + itemLimit < itemTotal;

  /* categorias */
  const [cats, setCats] = useState<ProductCategoryRead[]>([]);
  const [catsLoading, setCatsLoading] = useState(false);
  const [catTotal, setCatTotal] = useState(0);
  const [catSkip, setCatSkip] = useState(0);
  const catLimit = 100;
  const hasPrevCats = catSkip > 0;
  const hasNextCats = catSkip + catLimit < catTotal;

  // ─── draft setup ────────────────────────────────────
  const DRAFT_KEY_PREFIX = `loyaltyRuleModalDraft-${tplId}-`;
  const isFirstRun = useRef(true);

  // 1) restaura rascunho ou carrega do rule
  useEffect(() => {
    isFirstRun.current = true;
    const draftKey = `${DRAFT_KEY_PREFIX}${editingRuleId ?? 'new'}`;
    const draft = localStorage.getItem(draftKey);

    if (draft) {
      try {
        setFormState(JSON.parse(draft));
      } catch {}
    } else if (editingRuleId) {
      const rule = rules.find(r => r.id === editingRuleId);
      if (rule) {
        setFormState({
          rule_type: rule.rule_type,
          config: rule.config,
          order: rule.order,
          active: rule.active,
        });
      }
    } else {
      setFormState({
        rule_type: 'purchase_amount',
        config: {},
        order: 0,
        active: true,
      });
    }
  }, [editingRuleId, rules, tplId , DRAFT_KEY_PREFIX]);

  // 2) salva automaticamente após mudanças (pulando montagem)
  useEffect(() => {
    const draftKey = `${DRAFT_KEY_PREFIX}${editingRuleId ?? 'new'}`;
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    localStorage.setItem(draftKey, JSON.stringify(formState));
  }, [formState, editingRuleId, DRAFT_KEY_PREFIX, tplId]);


  // ─── fetch inicial das regras ───────────────────────
  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminListRules(tplId);
      setRules(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar regras');
    } finally {
      setLoading(false);
    }
  }, [tplId]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  /* --------------- carrega produtos --------------- */
  useEffect(() => {
    setItemsLoading(true);
    listInventoryItems(itemSkip, itemLimit)
      .then(({ data }) => {
        setItems(data.items);
        setItemTotal(data.total);
      })
      .catch(console.error)
      .finally(() => setItemsLoading(false));
  }, [itemSkip]);

  /* --------------- carrega categorias -------------- */
  useEffect(() => {
    setCatsLoading(true);
    listProductCategories(catSkip, catLimit)
      .then(({ data }) => {
        setCats(data.items);
        setCatTotal(data.total);
      })
      .catch(console.error)
      .finally(() => setCatsLoading(false));
  }, [catSkip]);


  /* ---------------- renderiza campos ---------------- */
function renderConfigFields() {
  switch (formState.rule_type) {
    /* ---------- valor de compra ---------- */
    case 'purchase_amount': {
      const cfg = formState.config as { amount?: number };
      return (
        <FloatingLabelInput
          label="Valor mínimo de compra"
          type="number"
          value={cfg.amount ?? ''}
          onChange={e =>
            setFormState(prev => ({
              ...prev,
              config: {
                ...(prev.config as { amount?: number }),
                amount: Number(e.target.value),
              },
            }))
          }
        />
      );
    }

    /* ---------- visitas ---------- */
    case 'visit': {
      const cfg = formState.config as { visits?: number };
      return (
        <FloatingLabelInput
          label="Visitas necessárias"
          type="number"
          value={cfg.visits ?? ''}
          onChange={e =>
            setFormState(prev => ({
              ...prev,
              config: {
                ...(prev.config as { visits?: number }),
                visits: Number(e.target.value),
              },
            }))
          }
        />
      );
    }

    /* ---------- serviço ---------- */
    case 'service_done': {
      const cfg = formState.config as { service_id?: string };
      return (
        <FloatingLabelInput
          label="ID do serviço"
          type="text"
          value={cfg.service_id ?? ''}
          onChange={e =>
            setFormState(prev => ({
              ...prev,
              config: {
                ...(prev.config as { service_id?: string }),
                service_id: e.target.value,
              },
            }))
          }
        />
      );
    }

    /* ---------- produtos ---------- */
    case 'product_bought': {
      const cfg = formState.config as { product_ids?: string[] };
      const selected = cfg.product_ids ?? [];

      if (itemsLoading) return <p>Carregando produtos…</p>;
      if (items.length === 0) {
        return (
          <div className={styles.noInventory}>
            <p>Nenhum produto encontrado.</p>
            <Button onClick={() => router.push('/register?section=inventory')}>
              Cadastrar Produtos
            </Button>
          </div>
        );
      }

      return (
        <div>
          <label className={styles.label}>Produtos elegíveis</label>
          <div className={styles.checkboxList}>
            {items.map(item => {
              const checked = selected.includes(item.id);
              return (
                <label
                  key={item.id}
                  className={`${styles.itemLabel} ${
                    checked ? styles.itemLabelChecked : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const next = checked
                        ? selected.filter(pid => pid !== item.id)
                        : [...selected, item.id];
                      setFormState(prev => ({
                        ...prev,
                        config: {
                          ...(prev.config as { product_ids?: string[] }),
                          product_ids: next,
                        },
                      }));
                    }}
                  />
                  {item.name}
                </label>
              );
            })}
          </div>

          {itemTotal > itemLimit && (
            <div className={styles.pagination}>
              <button
                onClick={() => setItemSkip(s => Math.max(s - itemLimit, 0))}
                disabled={!hasPrevItems}
              >
                Anterior
              </button>
              <span>
                {Math.floor(itemSkip / itemLimit) + 1} /{' '}
                {Math.ceil(itemTotal / itemLimit)}
              </span>
              <button
                onClick={() => setItemSkip(s => s + itemLimit)}
                disabled={!hasNextItems}
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      );
    }

    /* ---------- categorias ---------- */
    case 'category_bought': {
      const cfg = formState.config as { category_ids?: string[] };
      const selected = cfg.category_ids ?? [];

      if (catsLoading) return <p>Carregando categorias…</p>;
      if (cats.length === 0) {
        return (
          <div className={styles.noInventory}>
            <p>Nenhuma categoria encontrada.</p>
            <Button
              onClick={() => router.push('/register?section=categories')}
            >
              Cadastrar Categorias
            </Button>
          </div>
        );
      }

      return (
        <div>
          <label className={styles.label}>Categorias elegíveis</label>
          <div className={styles.checkboxList}>
            {cats.map(cat => {
              const checked = selected.includes(cat.id);
              return (
                <label
                  key={cat.id}
                  className={`${styles.itemLabel} ${
                    checked ? styles.itemLabelChecked : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const next = checked
                        ? selected.filter(cid => cid !== cat.id)
                        : [...selected, cat.id];
                      setFormState(prev => ({
                        ...prev,
                        config: {
                          ...(prev.config as { category_ids?: string[] }),
                          category_ids: next,
                        },
                      }));
                    }}
                  />
                  {cat.name}
                </label>
              );
            })}
          </div>

          {catTotal > catLimit && (
            <div className={styles.pagination}>
              <button
                onClick={() => setCatSkip(s => Math.max(s - catLimit, 0))}
                disabled={!hasPrevCats}
              >
                Anterior
              </button>
              <span>
                {Math.floor(catSkip / catLimit) + 1} /{' '}
                {Math.ceil(catTotal / catLimit)}
              </span>
              <button
                onClick={() => setCatSkip(s => s + catLimit)}
                disabled={!hasNextCats}
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      );
    }

    /* ---------- evento customizado ---------- */
    case 'custom_event': {
      const cfg = formState.config as { event_name?: string };
      return (
        <FloatingLabelInput
          label="Nome do evento"
          type="text"
          value={cfg.event_name ?? ''}
          onChange={e =>
            setFormState(prev => ({
              ...prev,
              config: {
                ...(prev.config as { event_name?: string }),
                event_name: e.target.value,
              },
            }))
          }
        />
      );
    }

    default:
      return null;
  }
}


  // ─── salvamento (add/update) ───────────────────────
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      if (editingRuleId) {
        await adminUpdateRule(tplId, editingRuleId, formState);
      } else {
        await adminAddRule(tplId, formState);
      }

      // 3) limpa draft do formulário atual
      const draftKey = `${DRAFT_KEY_PREFIX}${editingRuleId ?? 'new'}`;
      localStorage.removeItem(draftKey);

      // reset estado
      setEditingRuleId(null);
      setFormState({ rule_type: 'purchase_amount', config: {}, order: 0, active: true });
      await fetchRules();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar regra');
    }
  }

  // ─── editar e deletar ───────────────────────────────
  function handleEdit(rule: RuleRead) {
    setEditingRuleId(rule.id);
    // o efeito de restauração já vai puxar os dados
  }

  async function handleDelete(ruleId: string) {
    if (!confirm('Excluir esta regra?')) return;
    try {
      await adminDeleteRule(tplId, ruleId);
      await fetchRules();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao excluir');
    }
  }

  // ─── limpar formulário manualmente ──────────────────
  const handleClear = () => {
    const draftKey = `${DRAFT_KEY_PREFIX}${editingRuleId ?? 'new'}`;
    localStorage.removeItem(draftKey);
    isFirstRun.current = true;
    setEditingRuleId(null);
    setFormState({ rule_type: 'purchase_amount', config: {}, order: 0, active: true });
  };

  /* ---------------- render ---------------- */
  return (
    <div className={styles.container}>
      <h2>Regras do Cartão</h2>

      {/* Aviso de limite */}
      {!editingRuleId && rules.length >= MAX_RULES && (
        <Notification
          type="error"
          message={`Limite de ${MAX_RULES} regras atingido para este template.`}
          onClose={() => {}}
        />
      )}

      {error && <Notification type="error" message={error} onClose={() => setError(null)} />}

      {loading ? (
        <p>Carregando regras…</p>
      ) : (
        <ul className={styles.ruleList}>
          {rules.map(r => (
            <li key={r.id} className={styles.ruleItem}>
              <div><strong>Tipo:</strong> {ALL_TYPES.find(t => t.value === r.rule_type)?.label || r.rule_type}</div>
              <div className={styles.configText}>{getConfigText(r.rule_type, r.config, items, cats)}</div>
              <div><strong>Ordem:</strong> {r.order}</div>
              <div><strong>Ativa:</strong> {r.active ? 'Sim' : 'Não'}</div>
              <div className={styles.actions}>
                <Button onClick={() => handleEdit(r)}>Editar</Button>
                <Button bgColor="#f87171" onClick={() => handleDelete(r.id)}>Excluir</Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <h3>{editingRuleId ? 'Editar Regra' : 'Nova Regra'}</h3>

        <label>Tipo de Regra</label>
        <select
          value={formState.rule_type}
          onChange={e => setFormState({
            rule_type: e.target.value,
            config: {},
            order: formState.order,
            active: formState.active
          })}
          disabled={!canAdd}
        >
          {ALL_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <div className={styles.configSection}>{renderConfigFields()}</div>

        <FloatingLabelInput
          label="Ordem"
          type="number"
          value={formState.order}
          onChange={e => setFormState({ ...formState, order: Number(e.target.value) })}
        />

        <label className={styles.switch}>
          <input
            type="checkbox"
            checked={formState.active}
            onChange={e => setFormState({ ...formState, active: e.target.checked })}
          /> Ativa
        </label>

        {editingRuleId && (
          <p className={styles.preview}>
            Preview: {getConfigText(formState.rule_type, formState.config, items, cats)}
          </p>
        )}

        <div className={styles.submitActions}>
          <Button type="submit" disabled={!canAdd}>
            {editingRuleId ? 'Salvar' : 'Adicionar'}
          </Button>
          <Button
            type="button"
            bgColor="#f3f4f6"
            style={{ color: '#374151' }}            
            onClick={handleClear}
          >
            Limpar
          </Button>
          <Button
            type="button"
            bgColor="#e5e7eb"
            style={{ color: '#1f2937' }}
            onClick={onClose}
          >
            Fechar
          </Button>
        </div>
      </form>
    </div>
  );
}

// src/components/LoyaltyRuleModal/LoyaltyRuleModal.tsx
'use client';

import React, { useEffect, useState, FormEvent } from 'react';
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
  { value: 'service_done',    label: 'Serviço executado' },
  { value: 'product_bought',  label: 'Produto comprado' },
  { value: 'category_bought', label: 'Categoria comprada' },
  { value: 'custom_event',    label: 'Evento customizado' },
];

/* helper para texto amigável */
function getConfigText(
  ruleType: string,
  config: Record<string, any>,
  items: InventoryItemRead[],
  cats: ProductCategoryRead[]
): string {
  switch (ruleType) {
    case 'purchase_amount':
      return `Ganhe um carimbo para compras a partir de R$ ${config.amount}`;
    case 'visit': {
      const v = config.visits ?? 1;
      return `Ganhe um carimbo a cada ${v} visita${v > 1 ? 's' : ''}`;
    }
    case 'service_done':
      return `Ganhe um carimbo ao realizar o serviço de ID ${config.service_id}`;
    case 'product_bought': {
      const names = (config.product_ids || [])
        .map((id: string) => items.find(i => i.id === id)?.name)
        .filter(Boolean)
        .join(', ');
      return names || 'Ganhe um carimbo na compra de produto(s) selecionado(s)';
    }
    case 'category_bought': {
      const names = (config.category_ids || [])
        .map((id: string) => cats.find(c => c.id === id)?.name)
        .filter(Boolean)
        .join(', ');
      return names || 'Ganhe um carimbo na compra em categoria(s) selecionada(s)';
    }
    case 'custom_event':
      return `Ganhe um carimbo ao disparar o evento “${config.event_name}”`;
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

  /* ---------------- carrega regras ---------------- */
  useEffect(() => { fetchRules(); }, []);

  async function fetchRules() {
    setLoading(true);
    try {
      const res = await adminListRules(tplId);
      setRules(res.data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar regras');
    } finally {
      setLoading(false);
    }
  }

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
      case 'purchase_amount':
        return (
          <FloatingLabelInput
            label="Valor mínimo de compra"
            type="number"
            value={formState.config.amount || ''}
            onChange={e => setFormState({
              ...formState,
              config: { ...formState.config, amount: Number(e.target.value) }
            })}
          />
        );

      case 'visit':
        return (
          <FloatingLabelInput
            label="Visitas necessárias"
            type="number"
            value={formState.config.visits || ''}
            onChange={e => setFormState({
              ...formState,
              config: { ...formState.config, visits: Number(e.target.value) }
            })}
          />
        );

      case 'service_done':
        return (
          <FloatingLabelInput
            label="ID do serviço"
            type="text"
            value={formState.config.service_id || ''}
            onChange={e => setFormState({
              ...formState,
              config: { ...formState.config, service_id: e.target.value }
            })}
          />
        );

      /* ---------- produtos ---------- */
      case 'product_bought':
        if (itemsLoading) return <p>Carregando produtos…</p>;
        if (items.length === 0) {
          return (
            <div className={styles.noInventory}>
              <p>Nenhum produto encontrado.</p>
              <Button onClick={() => router.push('/register?section=inventory')}>Cadastrar Produtos</Button>
            </div>
          );
        }
        return (
          <div>
            <label className={styles.label}>Produtos elegíveis</label>
            <div className={styles.checkboxList}>
              {items.map(item => {
                const checked = (formState.config.product_ids || []).includes(item.id);
                return (
                  <label
                    key={item.id}
                    className={`${styles.itemLabel} ${checked ? styles.itemLabelChecked : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        const prev = formState.config.product_ids || [];
                        const next = checked
                          ? prev.filter((pid: string) => pid !== item.id)
                          : [...prev, item.id];
                        setFormState({ ...formState, config: { ...formState.config, product_ids: next } });
                      }}
                    />
                    {item.name}
                  </label>
                );
              })}
            </div>
            {itemTotal > itemLimit && (
              <div className={styles.pagination}>
                <button onClick={() => setItemSkip(s => Math.max(s - itemLimit, 0))} disabled={!hasPrevItems}>Anterior</button>
                <span>{Math.floor(itemSkip / itemLimit) + 1} / {Math.ceil(itemTotal / itemLimit)}</span>
                <button onClick={() => setItemSkip(s => s + itemLimit)} disabled={!hasNextItems}>Próxima</button>
              </div>
            )}
          </div>
        );

      /* ---------- categorias ---------- */
      case 'category_bought':
        if (catsLoading) return <p>Carregando categorias…</p>;
        if (cats.length === 0) {
          return (
            <div className={styles.noInventory}>
              <p>Nenhuma categoria encontrada.</p>
              <Button onClick={() => router.push('/register?section=categories')}>Cadastrar Categorias</Button>
            </div>
          );
        }
        return (
          <div>
            <label className={styles.label}>Categorias elegíveis</label>
            <div className={styles.checkboxList}>
              {cats.map(cat => {
                const checked = (formState.config.category_ids || []).includes(cat.id);
                return (
                  <label
                    key={cat.id}
                    className={`${styles.itemLabel} ${checked ? styles.itemLabelChecked : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        const prev = formState.config.category_ids || [];
                        const next = checked
                          ? prev.filter((cid: string) => cid !== cat.id)
                          : [...prev, cat.id];
                        setFormState({ ...formState, config: { ...formState.config, category_ids: next } });
                      }}
                    />
                    {cat.name}
                  </label>
                );
              })}
            </div>
            {catTotal > catLimit && (
              <div className={styles.pagination}>
                <button onClick={() => setCatSkip(s => Math.max(s - catLimit, 0))} disabled={!hasPrevCats}>Anterior</button>
                <span>{Math.floor(catSkip / catLimit) + 1} / {Math.ceil(catTotal / catLimit)}</span>
                <button onClick={() => setCatSkip(s => s + catLimit)} disabled={!hasNextCats}>Próxima</button>
              </div>
            )}
          </div>
        );

      case 'custom_event':
        return (
          <FloatingLabelInput
            label="Nome do evento"
            type="text"
            value={formState.config.event_name || ''}
            onChange={e => setFormState({
              ...formState,
              config: { ...formState.config, event_name: e.target.value }
            })}
          />
        );

      default:
        return null;
    }
  }

  /* ---------------- submissão ---------------- */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (editingRuleId) {
        await adminUpdateRule(tplId, editingRuleId, formState);
      } else {
        await adminAddRule(tplId, formState);
      }
      setEditingRuleId(null);
      setFormState({ rule_type: 'purchase_amount', config: {}, order: 0, active: true });
      await fetchRules();
    } catch (err: any) {
      setError(err.message || 'Falha ao salvar regra');
    }
  }

  async function handleEdit(rule: RuleRead) {
    setEditingRuleId(rule.id);
    setFormState({
      rule_type: rule.rule_type,
      config: rule.config,
      order: rule.order,
      active: rule.active
    });
  }

  async function handleDelete(ruleId: string) {
    if (!confirm('Excluir esta regra?')) return;
    try {
      await adminDeleteRule(tplId, ruleId);
      await fetchRules();
    } catch (err: any) {
      setError(err.message || 'Falha ao excluir');
    }
  }

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
            onClick={() => {
              setEditingRuleId(null);
              setFormState({ rule_type: 'purchase_amount', config: {}, order: 0, active: true });
            }}
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

// src/components/PointsRulesMain/PointsRuleModal/PointsRuleModal.tsx
'use client';

import { FormEvent, useState, useEffect,useRef } from 'react';
import { RuleType } from '@/types/points';
import type { PointsRuleRead, PointsRuleCreate } from '@/types/points';
import type { BranchRead } from '@/types/branch';
import type { ProductCategoryRead } from '@/types/productCategory';
import type { InventoryItemRead } from '@/types/inventoryItem';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import Button from '@/components/Button/Button';
import { getRuleTypeLabel } from '@/utils/roleUtils';
import { listBranches } from '@/services/branchService';
import { listProductCategories } from '@/services/productCategoryService';
import { listInventoryItems } from '@/services/inventoryItemService';
import styles from './PointsRuleModal.module.css';

interface Props {
  rule: PointsRuleRead | null;
  onSave: (data: PointsRuleCreate, id?: string) => void;
  onCancel: () => void;
}

export default function PointsRuleModal({ rule, onSave, onCancel }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ruleType, setRuleType] = useState<RuleType>(RuleType.value_spent);
  const [config, setConfig] = useState<Record<string, any>>({});
  const [active, setActive] = useState(true);
  const [visible, setVisible] = useState(true);
  const [branches, setBranches] = useState<BranchRead[]>([]);
  const [categories, setCategories] = useState<ProductCategoryRead[]>([]);
  const [catSkip, setCatSkip] = useState(0);
  const catLimit = 10;
  const [catTotal, setCatTotal] = useState(0);
  const [items, setItems] = useState<InventoryItemRead[]>([]);
  const [itemSkip, setItemSkip] = useState(0);
  const itemLimit = 10;
  const [itemTotal, setItemTotal] = useState(0);
  const [notification, setNotification] = useState<{ type: 'error'; message: string } | null>(null);
  const slugTouched = useRef(false);


  useEffect(() => {
    listProductCategories(catSkip, catLimit)
      .then(res => {
        setCategories(res.data.items);
        setCatTotal(res.data.total);
      })
      .catch(() => {
        // opcional: setNotification({ type: 'error', message: 'Falha ao carregar categorias.' });
      });
  }, [catSkip]);

  useEffect(() => {
    listInventoryItems(itemSkip, itemLimit)
      .then(res => {
        setItems(res.data.items);
        setItemTotal(res.data.total);
      })
      .catch(() => {
        // opcional: mostrar notificação de erro
      });
  }, [itemSkip]);

  useEffect(() => {
    listBranches()
      .then(res => setBranches(res.data))
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (rule) {
      setName(rule.name || '');
      setDescription(rule.description || '');
      setRuleType(rule.rule_type);
      setConfig(rule.config || {});
      setActive(rule.active);
      setVisible(rule.visible);
    } else {
      setName('');
      setDescription('');
      setRuleType(RuleType.value_spent);
      setConfig({});
      setActive(true);
      setVisible(true);
      setNotification(null);
    }
  }, [rule]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNotification({ type: 'error', message: 'O nome é obrigatório.' });
      return;
    }
    const payload: PointsRuleCreate = { name, description, rule_type: ruleType, config, active, visible };
    onSave(payload, rule?.id);
  };

  const toggleValue = (key: string, val: string) => {
    const arr: string[] = config[key] || [];
    const newArr = arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
    setConfig({ ...config, [key]: newArr });
  };

  const renderConfigFields = () => {
    switch (ruleType) {
      case RuleType.value_spent:
        return (
          <>
            <FloatingLabelInput
              label="R$ por passo"
              type="number"
              value={config.step ?? ''}
              onChange={e => setConfig({ ...config, step: Number(e.target.value) })}
            />
            <FloatingLabelInput
              label="Pontos por passo"
              type="number"
              value={config.points ?? ''}
              onChange={e => setConfig({ ...config, points: Number(e.target.value) })}
            />
          </>
        );
      case RuleType.event:
        return (
          <>
            <FloatingLabelInput
              label="Nome do evento"
              type="text"
              value={config.event_name ?? ''}
              onChange={e => setConfig({ ...config, event_name: e.target.value })}
            />
            <FloatingLabelInput
              label="Pontos"
              type="number"
              value={config.points ?? ''}
              onChange={e => setConfig({ ...config, points: Number(e.target.value) })}
            />
          </>
        );
      case RuleType.frequency:
        return (
          <>
            <FloatingLabelInput
              label="Janela de dias"
              type="number"
              value={config.window_days ?? ''}
              onChange={e => setConfig({ ...config, window_days: Number(e.target.value) })}
            />
            <FloatingLabelInput
              label="Compras mínimas"
              type="number"
              value={config.threshold ?? ''}
              onChange={e => setConfig({ ...config, threshold: Number(e.target.value) })}
            />
            <FloatingLabelInput
              label="Pontos de bônus"
              type="number"
              value={config.bonus_points ?? ''}
              onChange={e => setConfig({ ...config, bonus_points: Number(e.target.value) })}
            />
            <FloatingLabelInput
              label="Período de carência (dias)"
              type="number"
              value={config.cooldown_days ?? ''}
              onChange={e => setConfig({ ...config, cooldown_days: Number(e.target.value) })}
            />
          </>
        );
      case RuleType.category:
        return (
          <div className={styles.field}>
            <label>Categorias</label>
            <select
              multiple
              size={Math.min(categories.length, 10)}
              className={styles.multiSelect}
              value={config.categories || []}
              onChange={() => {}}
            >
              {categories.map(cat => (
                <option
                  key={cat.id}
                  value={cat.id}
                  onMouseDown={e => {
                    e.preventDefault();
                    const arr: string[] = config.categories || [];
                    const next = arr.includes(cat.id)
                      ? arr.filter(x => x !== cat.id)
                      : [...arr, cat.id];
                    setConfig({ ...config, categories: next });
                  }}
                >
                  {cat.name}
                </option>
              ))}
            </select>

            {/* controles de paginação */}
            <div className={styles.paginationControls}>
              <button
                type="button"
                disabled={catSkip === 0}
                onClick={() => setCatSkip(catSkip - catLimit)}
              >
                Anterior
              </button>
              <span>
                Página {Math.floor(catSkip / catLimit) + 1} de{' '}
                {Math.ceil(catTotal / catLimit)}
              </span>
              <button
                type="button"
                disabled={catSkip + catLimit >= catTotal}
                onClick={() => setCatSkip(catSkip + catLimit)}
              >
                Próximo
              </button>
            </div>

            {/* mostrar nomes selecionados abaixo */}
            <div className={styles.selectedText}>
              {(config.categories || [])
                .map((id: string) => categories.find(c => c.id === id)?.name)
                .filter(Boolean)
                .join(', ') || 'Nenhuma selecionada'}
            </div>

            <FloatingLabelInput
              label="Multiplicador"
              type="number"
              value={config.multiplier ?? ''}
              onChange={e =>
                setConfig({ ...config, multiplier: Number(e.target.value) })
              }
            />
          </div>
        );

      case RuleType.first_purchase:
        return (
          <FloatingLabelInput
            label="Pontos de boas-vindas"
            type="number"
            value={config.bonus_points ?? ''}
            onChange={e => setConfig({ ...config, bonus_points: Number(e.target.value) })}
          />
        );
      case RuleType.recurrence:
        return (
          <>
            <FloatingLabelInput
              label="Períodos consecutivos"
              type="number"
              value={config.consecutive_periods ?? ''}
              onChange={e => setConfig({ ...config, consecutive_periods: Number(e.target.value) })}
            />
            <FloatingLabelInput
              label="Período (dias)"
              type="number"
              value={config.period_days ?? ''}
              onChange={e => setConfig({ ...config, period_days: Number(e.target.value) })}
            />
            <FloatingLabelInput
              label="Compras mínimas por período"
              type="number"
              value={config.threshold_per_period ?? ''}
              onChange={e =>
                setConfig({ ...config, threshold_per_period: Number(e.target.value) })
              }
            />
            <FloatingLabelInput
              label="Pontos de bônus"
              type="number"
              value={config.bonus_points ?? ''}
              onChange={e => setConfig({ ...config, bonus_points: Number(e.target.value) })}
            />
            <FloatingLabelInput
              label="Período de carência (dias)"
              type="number"
              value={config.cooldown_days ?? ''}
              onChange={e => setConfig({ ...config, cooldown_days: Number(e.target.value) })}
            />
          </>
        );
      case RuleType.digital_behavior:
        return (
          <FloatingLabelInput
            label="Eventos (JSON)"
            type="text"
            value={JSON.stringify(config.events || {})}
            onChange={e => {
              try {
                setConfig({ ...config, events: JSON.parse(e.target.value) });
              } catch {
                // ignorar erro de JSON inválido
              }
            }}
          />
        );
      case RuleType.special_date:
        return (
          <>
            <FloatingLabelInput
              label="Data exata (MM-DD)"
              type="text"
              value={config.date ?? ''}
              onChange={e => setConfig({ ...config, date: e.target.value })}
            />
            <FloatingLabelInput
              label="Data início"
              type="date"
              value={config.start ?? ''}
              onChange={e => setConfig({ ...config, start: e.target.value })}
            />
            <FloatingLabelInput
              label="Data fim"
              type="date"
              value={config.end ?? ''}
              onChange={e => setConfig({ ...config, end: e.target.value })}
            />
            <FloatingLabelInput
              label="Multiplicador"
              type="number"
              value={config.multiplier ?? ''}
              onChange={e => setConfig({ ...config, multiplier: Number(e.target.value) })}
            />
          </>
        );
      case RuleType.geolocation:
  return (
    <div className={styles.field}>
      <label>Filial</label>
      <select
        className={styles.select}
        value={config.branch_id || ''}
        onChange={e => setConfig({ ...config, branch_id: e.target.value })}
      >
        <option value="">Nenhuma selecionada</option>
        {branches.map(b => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
      <FloatingLabelInput
        label="Pontos"
        type="number"
        value={config.points ?? ''}
        onChange={e => setConfig({ ...config, points: Number(e.target.value) })}
      />
    </div>
  );
  case RuleType.inventory:
  return (
    <div className={styles.field}>
      <label>Itens de Inventário</label>
      <select
        multiple
        size={Math.min(items.length, 10)}
        className={styles.multiSelect}
        value={config.item_ids || []}
        onChange={() => {}}
      >
        {items.map(it => (
          <option
            key={it.id}
            value={it.id}
            onMouseDown={e => {
              e.preventDefault();
              const arr: string[] = config.item_ids || [];
              const next = arr.includes(it.id)
                ? arr.filter(x => x !== it.id)
                : [...arr, it.id];
              setConfig({ ...config, item_ids: next });
            }}
          >
            {it.name}
          </option>
        ))}
      </select>

      {/* controles de paginação */}
      <div className={styles.paginationControls}>
        <button
          type="button"
          disabled={itemSkip === 0}
          onClick={() => setItemSkip(itemSkip - itemLimit)}
        >
          Anterior
        </button>
        <span>
          Página {Math.floor(itemSkip / itemLimit) + 1} de{' '}
          {Math.ceil(itemTotal / itemLimit)}
        </span>
        <button
          type="button"
          disabled={itemSkip + itemLimit >= itemTotal}
          onClick={() => setItemSkip(itemSkip + itemLimit)}
        >
          Próximo
        </button>
      </div>

      {/* nomes selecionados */}
      <div className={styles.selectedText}>
        {(config.item_ids || [])
          .map((id: string) => items.find(i => i.id === id)?.name)
          .filter(Boolean)
          .join(', ') || 'Nenhum selecionado'}
      </div>

      <FloatingLabelInput
        label="Multiplicador"
        type="number"
        value={config.multiplier ?? ''}
        onChange={e =>
          setConfig({ ...config, multiplier: Number(e.target.value) })
        }
      />
    </div>
  );
      default:
        return <p>Configuração não implementada para este tipo.</p>;
    }
  };

  return (
    <div className={styles.modalContent}>
      <h2>{rule ? 'Editar Regra' : 'Nova Regra'}</h2>

      <FloatingLabelInput
        label="Nome"
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
      />

      <div className={styles.field}>
        <label>Descrição</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          className={styles.textarea}
        />
      </div>

      <div className={styles.field}>
        <label>Tipo de Regra</label>
        <select
          value={ruleType}
          onChange={e => setRuleType(e.target.value as RuleType)}
          className={styles.select}
        >
          {Object.values(RuleType).map(rt => (
            <option key={rt} value={rt}>
              {getRuleTypeLabel(rt)}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.configSection}>
        <h3>Configuração</h3>
        {renderConfigFields()}
      </div>

      <div className={styles.switches}>
        <label>
          <input
            type="checkbox"
            checked={active}
            onChange={e => setActive(e.target.checked)}
          />{' '}
          Ativa
        </label>
        <label>
          <input
            type="checkbox"
            checked={visible}
            onChange={e => setVisible(e.target.checked)}
          />{' '}
          Visível
        </label>
      </div>

      <div className={styles.actions}>
        <Button onClick={handleSubmit}>
          Salvar
        </Button>
        <Button onClick={onCancel} bgColor="#f3f4f6" style={{ color: '#374151' }}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

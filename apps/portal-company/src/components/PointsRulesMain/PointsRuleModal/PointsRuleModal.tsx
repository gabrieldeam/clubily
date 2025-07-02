// src/components/PointsRulesMain/PointsRuleModal/PointsRuleModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { RuleType } from '@/types/points';
import type { PointsRuleRead, PointsRuleCreate } from '@/types/points';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import Button from '@/components/Button/Button';
import { getRuleTypeLabel } from '@/utils/roleUtils';
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

  useEffect(() => {
    if (rule) {
      setName(rule.name);
      setDescription(rule.description ?? '');
      setRuleType(rule.rule_type);
      setConfig(rule.config);
      setActive(rule.active);
      setVisible(rule.visible);
    }
  }, [rule]);

  const handleSubmit = () => {
    const payload: PointsRuleCreate = {
      name,
      description,
      rule_type: ruleType,
      config,
      active,
      visible,
    };
    onSave(payload, rule?.id);
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
              label="Dias na janela"
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
              label="Cooldown (dias)"
              type="number"
              value={config.cooldown_days ?? ''}
              onChange={e => setConfig({ ...config, cooldown_days: Number(e.target.value) })}
            />
          </>
        );
      case RuleType.category:
        return (
          <>
            <FloatingLabelInput
              label="Categorias (vírgula-separadas)"
              type="text"
              value={(config.categories || []).join(',')}
              onChange={e =>
                setConfig({
                  ...config,
                  categories: e.target.value.split(',').map(s => s.trim()),
                })
              }
            />
            <FloatingLabelInput
              label="Multiplicador"
              type="number"
              value={config.multiplier ?? ''}
              onChange={e => setConfig({ ...config, multiplier: Number(e.target.value) })}
            />
          </>
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
              label="Cooldown (dias)"
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
          <>
            <FloatingLabelInput
              label="ID da filial"
              type="text"
              value={config.branch_id ?? ''}
              onChange={e => setConfig({ ...config, branch_id: e.target.value })}
            />
            <FloatingLabelInput
              label="Pontos"
              type="number"
              value={config.points ?? ''}
              onChange={e => setConfig({ ...config, points: Number(e.target.value) })}
            />
          </>
        );
      case RuleType.inventory:
        return (
          <>
            <FloatingLabelInput
              label="IDs de item (vírgula-separados)"
              type="text"
              value={(config.item_ids || []).join(',')}
              onChange={e =>
                setConfig({
                  ...config,
                  item_ids: e.target.value.split(',').map(s => s.trim()),
                })
              }
            />
            <FloatingLabelInput
              label="Multiplicador"
              type="number"
              value={config.multiplier ?? ''}
              onChange={e => setConfig({ ...config, multiplier: Number(e.target.value) })}
            />
          </>
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
        <Button onClick={handleSubmit} bgColor="#10b981">
          Salvar
        </Button>
        <Button onClick={onCancel} bgColor="#f3f4f6" style={{ color: '#374151' }}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

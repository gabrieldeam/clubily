// src/components/PointsCompanyRulesMain/PointsCompanyRulesMain.tsx
'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { listCompanyVisibleRules, checkRuleStatus } from '@/services/pointsService';
import type { PointsRuleRead } from '@/types/pointsRule';
import { RuleType } from '@/types/pointsRule';
import { getRuleTypeLabel } from '@/utils/ruleType';
import RuleEligibilityModal from '@/components/RuleEligibilityModal/RuleEligibilityModal';
import styles from './PointsCompanyRulesMain.module.css';

interface Props {
  companyId: string;
}

const ELIGIBLE_RULE_TYPES = [
  RuleType.frequency,
  RuleType.first_purchase,
  RuleType.recurrence,
] as const;

export default function PointsCompanyRulesMain({ companyId }: Props) {
  const [rules, setRules] = useState<PointsRuleRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // estados para o modal de elegibilidade
  const [openModal, setOpenModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState<PointsRuleRead | null>(null);

  useEffect(() => {
    listCompanyVisibleRules(companyId)
      .then(r => setRules(r.data))
      .catch(() => setError('Não foi possível carregar regras.'))
      .finally(() => setLoading(false));
  }, [companyId]);

  if (loading || error || rules.length === 0) return null;

  const handleOpenModal = (rule: PointsRuleRead) => {
    setSelectedRule(rule);
    setOpenModal(true);
  };
  const handleCloseModal = () => {
    setSelectedRule(null);
    setOpenModal(false);
  };

  return (
    <>
      <div className={styles.whiteBox}>
        <h2 className={styles.sectionTitle}>Regras de Pontos</h2>
        <div className={styles.container}>
          {rules.map(rule => (
            <div key={rule.id} className={styles.card}>
              <div className={styles.header}>
                <h3 className={styles.name}>{rule.name}</h3>
                <span className={styles.badge}>
                  {getRuleTypeLabel(rule.rule_type as RuleType)}
                </span>
              </div>
              {rule.description && (
                <p className={styles.description}>{rule.description}</p>
              )}
              <div className={styles.explanation}>
                {renderConfigExplanation(rule)}
              </div>

              {/* Só renderiza o botão se o tipo da regra estiver na lista */}
              {ELIGIBLE_RULE_TYPES.includes(
                rule.rule_type as typeof ELIGIBLE_RULE_TYPES[number]
              ) && (
                <div className={styles.footer}>
                  <button
                    className={styles.checkBtn}
                    onClick={() => handleOpenModal(rule)}
                  >
                    Verificar elegibilidade
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedRule && (
        <RuleEligibilityModal
          open={openModal}
          onClose={handleCloseModal}
          rule={selectedRule}
          checkRuleStatus={checkRuleStatus}
        />
      )}
    </>
  );
}

// Função para renderizar explicação de configuração de cada regra
function renderConfigExplanation(rule: PointsRuleRead): ReactNode {
  switch (rule.rule_type) {
    case RuleType.value_spent: {
      const cfg = rule.config as { points: number; step: number };
      return (
        <p>
          Ganha <strong>{cfg.points}</strong> pontos a cada R${' '}
          <strong>{cfg.step}</strong> gasto.
        </p>
      );
    }
    case RuleType.event: {
      const cfg = rule.config as { points: number; event_name: string };
      return (
        <p>
          Ganha <strong>{cfg.points}</strong> pontos quando ocorre o evento “
          <em>{cfg.event_name}</em>”.
        </p>
      );
    }
    case RuleType.frequency: {
      const cfg = rule.config as {
        bonus_points: number;
        threshold: number;
        window_days: number;
        cooldown_days?: number | null;
      };
      return (
        <p>
          Ganha bônus de <strong>{cfg.bonus_points}</strong> pontos ao realizar{' '}
          <strong>{cfg.threshold}</strong> compras em uma janela de{' '}
          <strong>{cfg.window_days}</strong> dias.
          {cfg.cooldown_days != null && (
            <>
              {' '}Após prêmio, intervalo de carência de{' '}
              <strong>{cfg.cooldown_days}</strong> dias.
            </>
          )}
        </p>
      );
    }
    case RuleType.category: {
      const cfg = rule.config as { multiplier: number; categories: string[] };
      return (
        <p>
          Multiplica por <strong>{cfg.multiplier}</strong> os pontos em compras das categorias:{' '}
          <em>{cfg.categories.join(', ')}</em>.
        </p>
      );
    }
    case RuleType.first_purchase: {
      const cfg = rule.config as { bonus_points: number };
      return (
        <p>
          Primeira compra: ganha <strong>{cfg.bonus_points}</strong> pontos de boas-vindas.
        </p>
      );
    }
    case RuleType.recurrence: {
      const cfg = rule.config as {
        bonus_points: number;
        consecutive_periods: number;
        period_days: number;
        threshold_per_period: number;
        cooldown_days?: number | null;
      };
      return (
        <p>
          Ganha bônus de <strong>{cfg.bonus_points}</strong> pontos ao completar{' '}
          <strong>{cfg.consecutive_periods}</strong> períodos de{' '}
          <strong>{cfg.period_days}</strong> dias com pelo menos{' '}
          <strong>{cfg.threshold_per_period}</strong> compras cada.
          {cfg.cooldown_days != null && (
            <>
              {' '}Após prêmio, carência de <strong>{cfg.cooldown_days}</strong> dias.
            </>
          )}
        </p>
      );
    }
    case RuleType.digital_behavior: {
      const cfg = rule.config as { events: string[]; points: number };
      return (
        <p>
          A cada ocorrência dos eventos digitais ({cfg.events.join(', ')}), ganha{' '}
          pontos.
        </p>
      );
    }
    case RuleType.special_date: {
      const cfg = rule.config as {
        date: string;
        multiplier: number;
        start: string;
        end: string;
      };
      return (
        <p>
          Em <strong>{cfg.date}</strong> ganha multiplicador de{' '}
          <strong>{cfg.multiplier}</strong> pontos. Período ativo de {cfg.start} a {cfg.end}.
        </p>
      );
    }
    case RuleType.geolocation: {
      const cfg = rule.config as { branch_id: string; points: number };
      return (
        <p>
          Ao comprar na filial <strong>{cfg.branch_id}</strong>, ganha{' '}
          <strong>{cfg.points}</strong> pontos.
        </p>
      );
    }
    case RuleType.inventory: {
      const cfg = rule.config as { item_ids: string[]; multiplier: number };
      return (
        <p>
          Itens com IDs <em>{cfg.item_ids.join(', ')}</em> têm multiplicador x{' '}
          <strong>{cfg.multiplier}</strong>.
        </p>
      );
    }
    default: {
      const cfg = rule.config;
      return (
        <pre className={styles.rawConfig}>
          {JSON.stringify(cfg, null, 2)}
        </pre>
      );
    }
  }
}

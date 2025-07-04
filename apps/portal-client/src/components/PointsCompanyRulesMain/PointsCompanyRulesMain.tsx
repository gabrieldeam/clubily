// src/components/PointsCompanyRulesMain/PointsCompanyRulesMain.tsx
'use client';

import { useEffect, useState } from 'react'
import { listCompanyVisibleRules } from '@/services/pointsService'
import type { PointsRuleRead } from '@/types/pointsRule'
import { RuleType } from '@/types/pointsRule'
import { getRuleTypeLabel } from '@/utils/ruleType'
import styles from './PointsCompanyRulesMain.module.css'

interface Props {
  companyId: string
}

export default function PointsCompanyRulesMain({ companyId }: Props) {
  const [rules, setRules] = useState<PointsRuleRead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listCompanyVisibleRules(companyId)
      .then(r => setRules(r.data))
      .catch(() => setError('Não foi possível carregar regras.'))
      .finally(() => setLoading(false))
  }, [companyId])

  // enquanto carrega ou ocorre erro ou não há nenhuma regra: não renderiza nada
  if (loading || error || rules.length === 0) return null

  // só chega aqui se houver ao menos uma regra válida
  return (
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
              {/* aqui entra a renderConfigExplanation que você já definiu */}
              {renderConfigExplanation(rule)}
            </div>
            {/* <div className={styles.footer}>
              <span className={styles.flag}>
                {rule.active ? 'Ativa' : 'Inativa'}
              </span>
              <span className={styles.flag}>
                {rule.visible ? 'Visível' : 'Oculta'}
              </span>
            </div> */}
          </div>
        ))}
      </div>
    </div>
  )
}

// não esqueça de exportar também sua função renderConfigExplanation
function renderConfigExplanation(rule: PointsRuleRead) {
  const cfg = rule.config
  switch (rule.rule_type) {
    case RuleType.value_spent:
      return (
        <p>
          Ganha <strong>{cfg.points}</strong> pontos a cada R${' '}
          <strong>{cfg.step}</strong> gasto.
        </p>
      )
      case RuleType.event:
        return (
          <p>
            Ganha <strong>{cfg.points}</strong> pontos quando ocorre o evento “<em>{cfg.event_name}</em>”.
          </p>
        );
      case RuleType.frequency:
        return (
          <p>
            Ganha bônus de <strong>{cfg.bonus_points}</strong> pontos ao realizar <strong>{cfg.threshold}</strong> compras em uma janela de <strong>{cfg.window_days}</strong> dias.
          {cfg.cooldown_days != null && (
            <> Após prêmio, intervalo de carência de <strong>{cfg.cooldown_days}</strong> dias.</>
          )}
          </p>
        );
      case RuleType.category:
        return (
          <p>
            Multiplica por <strong>{cfg.multiplier}</strong> os pontos em compras das categorias: <em>{(cfg.categories || []).join(', ')}</em>.
          </p>
        );
      case RuleType.first_purchase:
        return (
          <p>
            Primeira compra: ganha <strong>{cfg.bonus_points}</strong> pontos de boas-vindas.
          </p>
        );
      case RuleType.recurrence:
        return (
          <p>
            Ganha bônus de <strong>{cfg.bonus_points}</strong> pontos ao completar <strong>{cfg.consecutive_periods}</strong> períodos de <strong>{cfg.period_days}</strong> dias com pelo menos <strong>{cfg.threshold_per_period}</strong> compras cada.
            {cfg.cooldown_days != null && (
              <> Após prêmio, carência de <strong>{cfg.cooldown_days}</strong> dias.</>
            )}
          </p>
        );
      case RuleType.digital_behavior:
        return (
          <p>
            A cada ocorrência dos eventos digitais configurados ({JSON.stringify(cfg.events)}), ganha pontos.
          </p>
        );
      case RuleType.special_date:
        return (
          <p>
            Em <strong>{cfg.date}</strong> ganha multiplicador de <strong>{cfg.multiplier}</strong> pontos. Período ativo de {cfg.start} a {cfg.end}.
          </p>
        );
      case RuleType.geolocation:
        return (
          <p>
            Ao comprar na filial <strong>{cfg.branch_id}</strong>, ganha <strong>{cfg.points}</strong> pontos.
          </p>
        );
      case RuleType.inventory:
        return (
          <p>
            Itens com IDs <em>{(cfg.item_ids || []).join(', ')}</em> têm multiplicador x<strong>{cfg.multiplier}</strong>.
          </p>
        );
    default:
      return (
        <pre className={styles.rawConfig}>
          {JSON.stringify(cfg, null, 2)}
        </pre>
      )
  }
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import Modal from '@/components/Modal/Modal';
import styles from './RuleParticipantsModal.module.css';

import type { PointsRuleRead } from '@/types/pointsRule';
import { RuleType } from '@/types/pointsRule';

import type { InventoryItemBasic } from '@/types/inventoryItem';
import type { ProductCategoryBasic } from '@/types/productCategory';

import { getInventoryItemsByIds } from '@/services/inventoryItemService';
import { getProductCategoriesByIds } from '@/services/productCategoryService';

type Props = {
  open: boolean;
  onClose: () => void;
  rule: PointsRuleRead;
};

export default function RuleParticipantsModal({ open, onClose, rule }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const [items, setItems] = useState<InventoryItemBasic[]>([]);
  const [cats, setCats]   = useState<ProductCategoryBasic[]>([]);

  const isInventory = rule.rule_type === RuleType.inventory;
  const isCategory  = rule.rule_type === RuleType.category;

  // Lê IDs do config de acordo com o tipo
  const idsToFetch = useMemo(() => {
    if (isInventory) {
      const cfg = rule.config as { item_ids?: string[]; multiplier?: number };
      return (cfg.item_ids ?? []).filter(Boolean);
    }
    if (isCategory) {
      const cfg = rule.config as { categories?: string[]; multiplier?: number };
      return (cfg.categories ?? []).filter(Boolean);
    }
    return [];
  }, [rule, isInventory, isCategory]);

  const multiplierText = useMemo(() => {
    if (isInventory) {
      const cfg = rule.config as { item_ids?: string[]; multiplier?: number };
      return cfg?.multiplier ? `Multiplicador: x${cfg.multiplier}` : null;
    }
    if (isCategory) {
      const cfg = rule.config as { categories?: string[]; multiplier?: number };
      return cfg?.multiplier ? `Multiplicador: x${cfg.multiplier}` : null;
    }
    return null;
  }, [rule, isInventory, isCategory]);

  useEffect(() => {
    if (!open) return;

    setLoading(true);
    setError(null);
    setItems([]);
    setCats([]);

    if (!idsToFetch.length) {
      setLoading(false);
      return;
    }

    const run = async () => {
      try {
        if (isInventory) {
          const data = await getInventoryItemsByIds(idsToFetch);
          setItems(data);
        } else if (isCategory) {
          const data = await getProductCategoriesByIds(idsToFetch);
          setCats(data);
        }
      } catch {
        setError('Falha ao carregar participantes.');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [open, idsToFetch, isInventory, isCategory]);

  return (
    <Modal open={open} onClose={onClose} width={640}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h3 className={styles.title}>Participantes da regra</h3>
          <p className={styles.subtitle}>
            {rule.name}
            {multiplierText ? <span className={styles.mul}> — {multiplierText}</span> : null}
          </p>
        </div>

        {loading && <p>Carregando...</p>}
        {error && <p className={styles.error}>{error}</p>}

        {!loading && !error && isInventory && (
          <>
            <p className={styles.sectionLabel}>Itens de inventário</p>
            {items.length === 0 ? (
              <p className={styles.empty}>Nenhum item selecionado.</p>
            ) : (
              <ul className={styles.list}>
                {items.map(it => (
                  <li key={it.id} className={styles.listItem}>
                    <span className={styles.primary}>{it.name}</span>
                    <span className={styles.secondary}>SKU: {it.sku}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {!loading && !error && isCategory && (
          <>
            <p className={styles.sectionLabel}>Categorias</p>
            {cats.length === 0 ? (
              <p className={styles.empty}>Nenhuma categoria selecionada.</p>
            ) : (
              <ul className={styles.list}>
                {cats.map(c => (
                  <li key={c.id} className={styles.listItem}>
                    <span className={styles.primary}>{c.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

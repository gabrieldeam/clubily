'use client';

import { FormEvent, useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
import { checkSlugAvailable } from '@/services/digitalBehaviorService';
import { slugify, validateSlug } from '@/utils/slug';

/** Campos possíveis dentro de `config` — e assinatura de índice para flexibilidade */
interface RuleConfig extends Record<string, unknown> {
  step?: number;
  points?: number;
  event_name?: string;
  window_days?: number;
  threshold?: number;
  threshold_per_period?: number;
  consecutive_periods?: number;
  period_days?: number;
  bonus_points?: number;
  cooldown_days?: number;
  categories?: string[];
  item_ids?: string[];
  branch_id?: string;
  multiplier?: number;
  events?: Record<string, unknown>;
  date?: string;
  start?: string;
  end?: string;
  slug?: string;
  valid_from?: string;
  valid_to?: string;
  max_attributions?: number;
}

interface Props {
  rule: PointsRuleRead | null;
  onSave: (data: PointsRuleCreate, id?: string) => void;
  onCancel: () => void;
}

export default function PointsRuleModal({ rule, onSave, onCancel }: Props) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ruleType, setRuleType] = useState<RuleType>(RuleType.value_spent);
  const hiddenRuleTypes = [RuleType.event];
  const [config, setConfig] = useState<RuleConfig>({});
  const [active, setActive] = useState(true);
  const [visible, setVisible] = useState(true);
  const [originalSlug, setOriginalSlug] = useState<string>('');

  const [branches, setBranches] = useState<BranchRead[]>([]);

  // --- Categorias (paginadas + busca + seleção)
  const [categories, setCategories] = useState<ProductCategoryRead[]>([]);
  const [catSkip, setCatSkip] = useState(0);
  const [catLimit, setCatLimit] = useState(10);
  const [catTotal, setCatTotal] = useState(0);
  const [catLoading, setCatLoading] = useState(false);
  const [catQuery, setCatQuery] = useState('');
  const [catShowSelectedOnly, setCatShowSelectedOnly] = useState(false);
  const [catIndex, setCatIndex] = useState<Record<string, string>>({});

  // --- Itens (paginados + busca + seleção)
  const [items, setItems] = useState<InventoryItemRead[]>([]);
  const [itemSkip, setItemSkip] = useState(0);
  const [itemLimit, setItemLimit] = useState(10);
  const [itemTotal, setItemTotal] = useState(0);
  const [itemLoading, setItemLoading] = useState(false);
  const [itemQuery, setItemQuery] = useState('');
  const [itemShowSelectedOnly, setItemShowSelectedOnly] = useState(false);
  const [itemIndex, setItemIndex] = useState<Record<string, string>>({});

  // seleção de itens (regra de inventário guarda em state separado)
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  /* ------------------------------- paginação ------------------------------- */
  const hasPrevItemPage = itemSkip > 0;
  const hasNextItemPage = itemSkip + itemLimit < itemTotal;
  const hasPrevCatPage = catSkip > 0;
  const hasNextCatPage = catSkip + catLimit < catTotal;

  /* ─── draft em localStorage ───────────────────────── */
  const DRAFT_KEY = `pointsRuleModalDraft-${rule?.id ?? 'new'}`;
  const isFirstRun = useRef(true);

  // utils
  const normalize = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const toShortId = (id: string) => id.slice(0, 8) + '…';

  // ✅ 1) declare um tipo de retorno explícito
  type ValidateResult =
    | { ok: true; cfg: RuleConfig }
    | { ok: false; msg: string };

  // ✅ 2) anote a função para devolver exatamente o tipo acima
  const validateAndNormalize = (type: RuleType, cfgIn: RuleConfig): ValidateResult => {
    const cfg: RuleConfig = { ...cfgIn };
    const has = (v: unknown): boolean => {
      if (v === undefined || v === null || v === '') return false;
      if (typeof v === 'number') return !Number.isNaN(v);
      return true;
    };
    switch (type) {
      case RuleType.value_spent:
        if (!has(cfg.step) || !has(cfg.points))
          return { ok: false, msg: 'Preencha "R$ por passo" e "Pontos por passo".' };
        break;
      case RuleType.first_purchase:
        if (!has(cfg.bonus_points))
          return { ok: false, msg: 'Informe os pontos.' };
        break;
      case RuleType.frequency:
        if (!has(cfg.window_days) || !has(cfg.threshold) || !has(cfg.bonus_points))
          return { ok: false, msg: 'Preencha janela, meta e pontos.' };
        break;
      case RuleType.recurrence:
        if (!has(cfg.period_days) || !has(cfg.threshold_per_period) || !has(cfg.consecutive_periods) || !has(cfg.bonus_points))
          return { ok: false, msg: 'Preencha todos os campos de recorrência.' };
        break;
      case RuleType.category:
        if (!Array.isArray(cfg.categories) || cfg.categories.length === 0)
          return { ok: false, msg: 'Selecione ao menos uma categoria.' };
        if (!has(cfg.multiplier)) return { ok: false, msg: 'Informe o multiplicador.' };
        break;
      case RuleType.inventory:
        if (!Array.isArray(cfg.item_ids) || cfg.item_ids.length === 0)
          return { ok: false, msg: 'Selecione ao menos um item.' };
        if (!has(cfg.multiplier)) return { ok: false, msg: 'Informe o multiplicador.' };
        break;
      case RuleType.geolocation:
        if (!has(cfg.branch_id)) return { ok: false, msg: 'Selecione a filial.' };
        if (!has(cfg.points)) return { ok: false, msg: 'Informe os pontos.' };
        break;
      case RuleType.special_date: {
        const fixed = typeof cfg.date === 'string' && cfg.date.length > 0;
        const range = typeof cfg.start === 'string' && typeof cfg.end === 'string' && cfg.start && cfg.end;
        if (!fixed && !range)
          return { ok: false, msg: 'Use data fixa (MM-DD) ou intervalo (YYYY-MM-DD a YYYY-MM-DD).' };
        if (!has(cfg.multiplier) || Number(cfg.multiplier) <= 0)
          return { ok: false, msg: 'Defina um multiplicador > 0.' };
        if (fixed) {
          delete cfg.start;
          delete cfg.end;
        }
        if (range) {
          delete cfg.date;
        }
        break;
      }
    }

    return { ok: true, cfg };
  };

  // fetch
useEffect(() => {
  let cancelled = false;
  setCatLoading(true);
  listProductCategories(catSkip, catLimit)
    .then((res) => {
      if (cancelled) return;
      setCategories(res.data.items);
      setCatTotal(res.data.total);
      setCatIndex((prev) => {
        const next = { ...prev };
        res.data.items.forEach((c: ProductCategoryRead) => (next[c.id] = c.name));
        return next;
      });
    })
    .catch(() => {
      if (!cancelled) {
        setCategories([]);
        setCatTotal(0);
      }
    })
    .finally(() => {
      if (!cancelled) setCatLoading(false);
    });
  return () => {
    cancelled = true;
  };
}, [catSkip, catLimit]); // deps ok

// 🔧 3) Use os setters de loading na busca de ITENS
useEffect(() => {
  let cancelled = false;
  setItemLoading(true);
  listInventoryItems(itemSkip, itemLimit)
    .then((res) => {
      if (cancelled) return;
      setItems(res.data.items);
      setItemTotal(res.data.total);
      setItemIndex((prev) => {
        const next = { ...prev };
        res.data.items.forEach((i: InventoryItemRead) => (next[i.id] = i.name));
        return next;
      });
    })
    .catch(() => {
      if (!cancelled) {
        setItems([]);
        setItemTotal(0);
      }
    })
    .finally(() => {
      if (!cancelled) setItemLoading(false);
    });
  return () => {
    cancelled = true;
  };
}, [itemSkip, itemLimit]);


  useEffect(() => {
    listBranches().then(res => setBranches(res.data));
  }, []);

  // 1) ao abrir: restaura do draft (se criando) ou do `rule` (se editando)
  useEffect(() => {
    isFirstRun.current = true;
    if (rule) {
      // edição
      setName(rule.name);
      setDescription(rule.description ?? '');
      setRuleType(rule.rule_type);
      setConfig(rule.config ?? {});
      setOriginalSlug((rule.config?.slug as string) || '');
      setActive(rule.active);
      setVisible(rule.visible);
      setSelectedItems([]);
      if (rule.rule_type === RuleType.inventory) {
        const ids = (rule.config?.item_ids as string[]) || [];
        setSelectedItems(ids);
      } else {
        setSelectedItems([]);
      }
    } else {
      // criação -> tenta restaurar
      const d = localStorage.getItem(DRAFT_KEY);
      if (d) {
        try {
          const {
            name: n,
            description: desc,
            ruleType: rt,
            config: cfg,
            active: a,
            visible: v,
            originalSlug: os,
          } = JSON.parse(d);
          setName(n);
          setDescription(desc);
          setRuleType(rt);
          setConfig(cfg);
          setOriginalSlug(os);
          setActive(a);
          setVisible(v);
        } catch {
          // invalido, carrega valores padrão
          setName('');
          setDescription('');
          setRuleType(RuleType.value_spent);
          setConfig({});
          setOriginalSlug('');
          setActive(true);
          setVisible(true);
        }
      }
    }
  }, [rule, DRAFT_KEY]);

  // 2) salva draft a cada mudança no formulário, só em criação
  useEffect(() => {
    if (rule) return; // somente no create
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        name,
        description,
        ruleType,
        config,
        active,
        visible,
        originalSlug,
      })
    );
  }, [name, description, ruleType, config, active, visible, originalSlug, rule, DRAFT_KEY]);

  // filtros client-side na página atual
  const selectedCategories = useMemo(
    () => (config.categories ?? []) as string[],
    [config.categories]
  );

  const filteredCats = useMemo<ProductCategoryRead[]>(() => {
    const q = normalize(catQuery);
    const list = catShowSelectedOnly
      ? categories.filter(c => selectedCategories.includes(c.id))
      : categories;
    return q ? list.filter(c => normalize(c.name).includes(q)) : list;
  }, [categories, catQuery, catShowSelectedOnly, selectedCategories]);

  const filteredItems = useMemo<InventoryItemRead[]>(() => {
    const q = normalize(itemQuery);
    const list = itemShowSelectedOnly
      ? items.filter(i => selectedItems.includes(i.id))
      : items;
    return q ? list.filter(i => normalize(i.name).includes(q)) : list;
  }, [items, itemQuery, itemShowSelectedOnly, selectedItems]);

  // submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (ruleType === RuleType.digital_behavior) {
      const s = config.slug as string;
      const slugChanged = !rule || s !== originalSlug;
      if (slugChanged) {
        if (!validateSlug(s)) {
          alert('Slug inválido: use apenas letras, números e hífens.');
          return;
        }
        setCheckingSlug(true);
        const ok = await checkSlugAvailable(s);
        setCheckingSlug(false);
        if (!ok) {
          alert('Este slug já está em uso. Escolha outro.');
          return;
        }
        setSelectedItems([]);
      }
    }

    let cfg = { ...config };
    if (ruleType === RuleType.inventory) cfg.item_ids = selectedItems;

    const v = validateAndNormalize(ruleType, cfg);
    if (!v.ok) {
      alert(v.msg);
      return;
    }
    cfg = v.cfg;

    if (ruleType === RuleType.special_date) {
      const hasFixed = typeof cfg.date === 'string' && cfg.date.length > 0;
      const hasRange =
        typeof cfg.start === 'string' &&
        typeof cfg.end === 'string' &&
        cfg.start &&
        cfg.end;
      if (!hasFixed && !hasRange) {
        alert('Data especial: preencha uma data fixa (MM-DD) ou um intervalo (start e end em YYYY-MM-DD).');
        return;
      }
      if (!cfg.multiplier || Number(cfg.multiplier) <= 0) {
        alert('Defina um multiplicador maior que 0.');
        return;
      }
    }

    const payload: PointsRuleCreate = {
      name,
      description,
      rule_type: ruleType,
      config: cfg,
      active,
      visible,
    };
    onSave(payload, rule?.id);

    localStorage.removeItem(DRAFT_KEY);
  };

  // UI actions seleção
  const toggleCat = (id: string) => {
    const curr = (config.categories ?? []) as string[];
    const next = curr.includes(id) ? curr.filter(x => x !== id) : [...curr, id];
    setConfig({ ...config, categories: next });
  };
  const selectAllCatsPage = () => {
    const curr = (config.categories ?? []) as string[];
    const ids = filteredCats.map(c => c.id);
    const next = Array.from(new Set([...curr, ...ids]));
    setConfig({ ...config, categories: next });
  };
  const clearAllCats = () => {
    setConfig({ ...config, categories: [] });
  };

  const toggleItem = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };
  const selectAllItemsPage = () => {
    const ids = filteredItems.map(i => i.id);
    setSelectedItems(prev => Array.from(new Set([...prev, ...ids])));
  };
  const clearAllItems = () => setSelectedItems([]);

  // render
  const num = (v: unknown) => (typeof v === 'number' ? v : '');
  const str = (v: unknown) => (typeof v === 'string' ? v : '');

  const renderConfigFields = () => {
    switch (ruleType) {
      case RuleType.value_spent:
        return (
          <>
            <FloatingLabelInput
              label="R$ por passo"
              type="number"
              min={0}
              value={num(config.step)}
              onChange={e => setConfig({ ...config, step: Number(e.target.value) })}
            />
            <FloatingLabelInput
              label="Pontos por passo"
              type="number"
              min={0}
              value={num(config.points)}
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
              value={str(config.event_name)}
              onChange={e => setConfig({ ...config, event_name: e.target.value })}
            />
            <FloatingLabelInput
              label="Pontos"
              type="number"
              min={0}
              value={num(config.points)}
              onChange={e => setConfig({ ...config, points: Number(e.target.value) })}
            />
          </>
        );

      case RuleType.category: {
        return (
          <section className={styles.selectSection}>
            <header className={styles.selectHeader}>
              <h3>
                Categorias <span className={styles.countChip}>{selectedCategories.length}</span>
              </h3>
              <div className={styles.selectTools}>
                <input
                  className={styles.searchInput}
                  placeholder="Buscar categoria..."
                  value={catQuery}
                  onChange={e => setCatQuery(e.target.value)}
                />
                <label className={styles.inlineToggle}>
                  <input
                    type="checkbox"
                    checked={catShowSelectedOnly}
                    onChange={e => setCatShowSelectedOnly(e.target.checked)}
                  />
                  Mostrar só selecionadas
                </label>
                <button
                  type="button"
                  className={styles.miniBtn}
                  onClick={selectAllCatsPage}
                  disabled={!filteredCats.length}
                >
                  Selecionar tudo (página)
                </button>
                <button
                  type="button"
                  className={styles.miniBtn}
                  onClick={clearAllCats}
                  disabled={!selectedCategories.length}
                >
                  Limpar seleção
                </button>
              </div>
            </header>

            {!catLoading && !categories.length ? (
              <div className={styles.emptyBlock}>
                <p>Você ainda não cadastrou nenhuma categoria.</p>
                <Button onClick={() => router.push('/register?section=categories')}>
                  Cadastrar categoria
                </Button>
              </div>
            ) : (
              <>
                <div className={styles.checkboxGrid}>
                  {catLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <div className={`${styles.skeleton} ${styles.cardStub}`} key={i} />
                    ))
                  ) : (
                    filteredCats.map(c => (
                      <label
                        key={c.id}
                        className={`${styles.cardOption} ${
                          selectedCategories.includes(c.id) ? styles.cardOptionChecked : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(c.id)}
                          onChange={() => toggleCat(c.id)}
                        />
                        <span className={styles.cardTitle}>{c.name}</span>
                      </label>
                    ))
                  )}
                </div>

                {!catLoading && filteredCats.length === 0 && categories.length > 0 && (
                  <div className={styles.helperText}>Nenhuma categoria encontrada para o filtro.</div>
                )}

                <footer className={styles.selectFooter}>
                  <div className={styles.paginationControls}>
                    <button
                      type="button"
                      disabled={!hasPrevCatPage || catLoading}
                      onClick={() => !catLoading && setCatSkip(prev => Math.max(prev - catLimit, 0))}
                    >
                      Anterior
                    </button>
                    <span>
                      Página {Math.floor(catSkip / catLimit) + 1} de {Math.max(1, Math.ceil(catTotal / catLimit))}
                    </span>
                    <button
                      type="button"
                      disabled={!hasNextCatPage || catLoading}
                      onClick={() => !catLoading && setCatSkip(prev => prev + catLimit)}
                    >
                      Próxima
                    </button>
                    <select
                      className={styles.pageSize}
                      value={catLimit}
                      onChange={e => {
                        setCatSkip(0);
                        setCatLimit(Number(e.target.value));
                      }}
                    >
                      {[10, 20, 50, 100].map(n => (
                        <option key={n} value={n}>
                          {n}/página
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedCategories.length > 0 && (
                    <div className={styles.chips}>
                      {selectedCategories.map(id => (
                        <span key={id} className={styles.chip}>
                          {catIndex[id] || toShortId(id)}
                          <button type="button" aria-label="Remover" onClick={() => toggleCat(id)}>
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className={styles.field}>
                    <FloatingLabelInput
                      label="Multiplicador"
                      type="number"
                      min={0}
                      value={num(config.multiplier)}
                      onChange={e =>
                        setConfig({ ...config, multiplier: Number(e.target.value) })
                      }
                    />
                  </div>
                </footer>
              </>
            )}
          </section>
        );
      }

      case RuleType.inventory: {
        return (
          <section className={styles.selectSection}>
            <header className={styles.selectHeader}>
              <h3>
                Itens de inventário{' '}
                <span className={styles.countChip}>{selectedItems.length}</span>
              </h3>
              <div className={styles.selectTools}>
                <input
                  className={styles.searchInput}
                  placeholder="Buscar item..."
                  value={itemQuery}
                  onChange={e => setItemQuery(e.target.value)}
                />
                <label className={styles.inlineToggle}>
                  <input
                    type="checkbox"
                    checked={itemShowSelectedOnly}
                    onChange={e => setItemShowSelectedOnly(e.target.checked)}
                  />
                  Mostrar só selecionados
                </label>
                <button
                  type="button"
                  className={styles.miniBtn}
                  onClick={selectAllItemsPage}
                  disabled={!filteredItems.length}
                >
                  Selecionar tudo (página)
                </button>
                <button
                  type="button"
                  className={styles.miniBtn}
                  onClick={clearAllItems}
                  disabled={!selectedItems.length}
                >
                  Limpar seleção
                </button>
              </div>
            </header>

            {!itemLoading && !items.length ? (
              <div className={styles.emptyBlock}>
                <p>Você ainda não cadastrou nenhum item de inventário.</p>
                <Button onClick={() => router.push('/register?section=inventory')}>
                  Cadastrar item de inventário
                </Button>
              </div>
            ) : (
              <>
                <div className={styles.checkboxGrid}>
                  {itemLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <div className={`${styles.skeleton} ${styles.cardStub}`} key={i} />
                    ))
                  ) : (
                    filteredItems.map(i => (
                      <label
                        key={i.id}
                        className={`${styles.cardOption} ${
                          selectedItems.includes(i.id) ? styles.cardOptionChecked : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(i.id)}
                          onChange={() => toggleItem(i.id)}
                        />
                        <span className={styles.cardTitle}>{i.name}</span>
                      </label>
                    ))
                  )}
                </div>

                {!itemLoading && filteredItems.length === 0 && items.length > 0 && (
                  <div className={styles.helperText}>Nenhum item encontrado para o filtro.</div>
                )}

                <footer className={styles.selectFooter}>
                  <div className={styles.paginationControls}>
                    <button
                      type="button"
                      disabled={!hasPrevItemPage || itemLoading}
                      onClick={() => !itemLoading && setItemSkip(prev => Math.max(prev - itemLimit, 0))}
                    >
                      Anterior
                    </button>
                    <span>
                      Página {Math.floor(itemSkip / itemLimit) + 1} de {Math.max(1, Math.ceil(itemTotal / itemLimit))}
                    </span>
                    <button
                      type="button"
                      disabled={!hasNextItemPage || itemLoading}
                      onClick={() => !itemLoading && setItemSkip(prev => prev + itemLimit)}
                    >
                      Próxima
                    </button>
                    <select
                      className={styles.pageSize}
                      value={itemLimit}
                      onChange={e => {
                        setItemSkip(0);
                        setItemLimit(Number(e.target.value));
                      }}
                    >
                      {[10, 20, 50, 100].map(n => (
                        <option key={n} value={n}>
                          {n}/página
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedItems.length > 0 && (
                    <div className={styles.chips}>
                      {selectedItems.map(id => (
                        <span key={id} className={styles.chip}>
                          {itemIndex[id] || toShortId(id)}
                          <button type="button" aria-label="Remover" onClick={() => toggleItem(id)}>
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className={styles.field}>
                    <FloatingLabelInput
                      label="Multiplicador"
                      type="number"
                      min={0}
                      value={num(config.multiplier)}
                      onChange={e =>
                        setConfig({ ...config, multiplier: Number(e.target.value) })
                      }
                    />
                  </div>
                </footer>
              </>
            )}
          </section>
        );
      }

      case RuleType.geolocation:
        if (!branches.length) {
          return (
            <div className={styles.field}>
              <Button onClick={() => router.push('/register')}>Cadastrar filial</Button>
            </div>
          );
        }
        return (
          <div className={styles.field}>
            <label>Filial</label>
            <select
              className={styles.select}
              value={str(config.branch_id)}
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
              min={0}
              value={num(config.points)}
              onChange={e => setConfig({ ...config, points: Number(e.target.value) })}
            />
          </div>
        );

      case RuleType.digital_behavior:
        return (
          <>
            <FloatingLabelInput
              label="Slug (único)"
              type="text"
              value={typeof config.slug === 'string' ? config.slug : ''}
              onChange={e => {
                const raw = e.target.value;
                let s = slugify(raw);
                if (raw.endsWith(' ')) {
                  s = slugify(raw.trim()) + '-';
                }
                setConfig({ ...config, slug: s });
                setSlugAvailable(null);
              }}
              onBlur={async () => {
                const s = config.slug as string;
                if (!validateSlug(s)) {
                  setSlugAvailable(false);
                  return;
                }
                setCheckingSlug(true);
                const ok = await checkSlugAvailable(s);
                setSlugAvailable(ok);
                setCheckingSlug(false);
              }}
            />
            {!(config.slug as string)?.length && (
              <div className={styles.errorText}>O slug precisa ter ao menos 1 caractere.</div>
            )}
            {checkingSlug && <div className={styles.helperText}>Verificando...</div>}
            {config.slug && !validateSlug(config.slug as string) && (
              <div className={styles.errorText}>Formato inválido. Use apenas a–z, 0–9 e hífens.</div>
            )}
            {slugAvailable === false && validateSlug(config.slug as string) && (
              <div className={styles.errorText}>Este slug já está em uso.</div>
            )}
            {slugAvailable === true && validateSlug(config.slug as string) && (
              <div className={styles.successText}>Slug disponível ✅</div>
            )}

            <FloatingLabelInput
              label="Pontos a atribuir"
              type="number"
              min={0}
              value={num(config.points)}
              onChange={e => setConfig({ ...config, points: Number(e.target.value) })}
            />
            <FloatingLabelInput
              label="Validade (início)"
              type="datetime-local"
              value={str(config.valid_from)}
              onChange={e => setConfig({ ...config, valid_from: e.target.value })}
            />
            <FloatingLabelInput
              label="Validade (fim)"
              type="datetime-local"
              value={str(config.valid_to)}
              onChange={e => setConfig({ ...config, valid_to: e.target.value })}
            />
            <FloatingLabelInput
              label="Máximo de usos por usuário"
              type="number"
              min={0}
              value={num(config.max_attributions)}
              onChange={e =>
                setConfig({ ...config, max_attributions: Number(e.target.value) })
              }
            />
          </>
        );

      case RuleType.first_purchase:
        return (
          <>
            <FloatingLabelInput
              label="Pontos (primeira compra)"
              type="number"
              min={0}
              value={num(config.bonus_points)}
              onChange={e =>
                setConfig({ ...config, bonus_points: Number(e.target.value) })
              }
            />
            <FloatingLabelInput
              label="Período de espera (dias) — opcional"
              type="number"
              min={0}
              value={num(config.cooldown_days)}
              onChange={e =>
                setConfig({ ...config, cooldown_days: Number(e.target.value) })
              }
            />
          </>
        );

      case RuleType.frequency:
        return (
          <>
            <FloatingLabelInput
              label="Janela (dias)"
              type="number"
              min={0}
              value={num(config.window_days)}
              onChange={e =>
                setConfig({ ...config, window_days: Number(e.target.value) })
              }
            />
            <FloatingLabelInput
              label="Meta de compras na janela"
              type="number"
              min={0}
              value={num(config.threshold)}
              onChange={e =>
                setConfig({ ...config, threshold: Number(e.target.value) })
              }
            />
            <FloatingLabelInput
              label="Pontos ao atingir a meta"
              type="number"
              min={0}
              value={num(config.bonus_points)}
              onChange={e =>
                setConfig({ ...config, bonus_points: Number(e.target.value) })
              }
            />
            <FloatingLabelInput
              label="Período de espera (dias) — opcional"
              type="number"
              min={0}
              value={num(config.cooldown_days)}
              onChange={e =>
                setConfig({ ...config, cooldown_days: Number(e.target.value) })
              }
            />
          </>
        );

      case RuleType.recurrence:
        return (
          <>
            <FloatingLabelInput
              label="Tamanho do período (dias)"
              type="number"
              min={0}
              value={num(config.period_days)}
              onChange={e =>
                setConfig({ ...config, period_days: Number(e.target.value) })
              }
            />
            <FloatingLabelInput
              label="Compras mínimas por período"
              type="number"
              min={0}
              value={num(config.threshold_per_period)}
              onChange={e =>
                setConfig({
                  ...config,
                  threshold_per_period: Number(e.target.value),
                })
              }
            />
            <FloatingLabelInput
              label="Períodos consecutivos necessários"
              type="number"
              min={0}
              value={num(config.consecutive_periods)}
              onChange={e =>
                setConfig({
                  ...config,
                  consecutive_periods: Number(e.target.value),
                })
              }
            />
            <FloatingLabelInput
              label="Pontos ao completar a sequência"
              type="number"
              min={0}
              value={num(config.bonus_points)}
              onChange={e =>
                setConfig({ ...config, bonus_points: Number(e.target.value) })
              }
            />
            <FloatingLabelInput
              label="Período de espera (dias) — opcional"
              type="number"
              min={0}
              value={num(config.cooldown_days)}
              onChange={e =>
                setConfig({ ...config, cooldown_days: Number(e.target.value) })
              }
            />
          </>
        );

      case RuleType.special_date:
        return (
          <div className={styles.field}>
            <p className={styles.helperText}>
              Use <strong>uma</strong> das opções: <em>data fixa</em> (MM-DD) ou{' '}
              <em>intervalo</em> (YYYY-MM-DD a YYYY-MM-DD).
            </p>
            <FloatingLabelInput
              label="Data fixa (MM-DD) — ex.: 09-15"
              type="text"
              value={str(config.date)}
              onChange={e => setConfig({ ...config, date: e.target.value })}
            />
            <p>Intervalo</p>
            <div className={styles.inline}>
              <FloatingLabelInput
                label="Início (YYYY-MM-DD)"
                type="date"
                value={str(config.start)}
                onChange={e => setConfig({ ...config, start: e.target.value })}
              />
              <FloatingLabelInput
                label="Fim (YYYY-MM-DD)"
                type="date"
                value={str(config.end)}
                onChange={e => setConfig({ ...config, end: e.target.value })}
              />
            </div>
            <FloatingLabelInput
              label="Multiplicador (ex.: 2 = dobra)"
              type="number"
              min={0}
              value={num(config.multiplier)}
              onChange={e =>
                setConfig({ ...config, multiplier: Number(e.target.value) })
              }
            />
            <FloatingLabelInput
              label="Período de espera (dias) — opcional"
              type="number"
              min={0}
              value={num(config.cooldown_days)}
              onChange={e =>
                setConfig({ ...config, cooldown_days: Number(e.target.value) })
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
          {Object.values(RuleType)
            .filter(rt => !hiddenRuleTypes.includes(rt))
            .map(rt => (
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
        <Button
          onClick={handleSubmit}
          disabled={
            ruleType === RuleType.digital_behavior &&
            (!(config.slug as string)?.length ||
              !validateSlug(config.slug as string) ||
              checkingSlug ||
              slugAvailable === false)
          }
        >
          Salvar
        </Button>
        <Button onClick={onCancel} bgColor="#f3f4f6" style={{ color: '#374151' }}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

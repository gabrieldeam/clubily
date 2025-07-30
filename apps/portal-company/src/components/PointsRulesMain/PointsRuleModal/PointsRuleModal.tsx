// src/components/PointsRulesMain/PointsRuleModal/PointsRuleModal.tsx
'use client';

import { FormEvent, useState, useEffect, useRef  } from 'react';
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
  const [categories, setCategories] = useState<ProductCategoryRead[]>([]);
  const [items, setItems] = useState<InventoryItemRead[]>([]);

  const catLimit = 10;
  const [catSkip, setCatSkip] = useState(0);
  const [catTotal, setCatTotal] = useState(0);
  const itemLimit = 10;
  const [itemSkip, setItemSkip] = useState(0);
  const [itemTotal, setItemTotal] = useState(0);
  
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  /* ------------------------------- paginação ------------------------------- */
  const hasPrevPage = itemSkip > 0;
  const hasNextPage = itemSkip + itemLimit < itemTotal;

  const goPrevPage = () => {
    if (hasPrevPage) setItemSkip(prev => Math.max(prev - itemLimit, 0));
  };

  const goNextPage = () => {
    if (hasNextPage) setItemSkip(prev => prev + itemLimit);
  };

   /* ─── draft em localStorage ───────────────────────── */
  const DRAFT_KEY = `pointsRuleModalDraft-${rule?.id ?? 'new'}`;
  const isFirstRun = useRef(true);

  useEffect(() => {
    listProductCategories(catSkip, catLimit).then(res => {
      setCategories(res.data.items);
      setCatTotal(res.data.total);
    });
  }, [catSkip]);

  useEffect(() => {
    listInventoryItems(itemSkip, itemLimit).then(res => {
      setItems(res.data.items);
      setItemTotal(res.data.total);
    });
  }, [itemSkip]);

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
    if (rule) return;                     // somente no create
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

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  if (!name.trim()) return;

  if (ruleType === RuleType.digital_behavior) {
    const s = config.slug as string;
    // só valida se for nova regra ou se o slug mudou
    const slugChanged = !rule || s !== originalSlug;
    if (slugChanged) {
      // verifica formato
      if (!validateSlug(s)) {
        alert('Slug inválido: use apenas letras, números e hífens.');
        return;
      }
      // checa disponibilidade no backend
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

  const payload: PointsRuleCreate = {
    name,
    description,
    rule_type: ruleType,
    config,
    active,
    visible
  };
  onSave(payload, rule?.id);
  
    localStorage.removeItem(DRAFT_KEY);
};




  const num = (v: unknown) => (typeof v === 'number' ? v : '');
  const str = (v: unknown) => (typeof v === 'string' ? v : '');

  const renderConfigFields = () => {
    switch (ruleType) {
      case RuleType.value_spent:
        return (
          <>
            <FloatingLabelInput label="R$ por passo" type="number" value={num(config.step)} onChange={e => setConfig({ ...config, step: Number(e.target.value) })} />
            <FloatingLabelInput label="Pontos por passo" type="number" value={num(config.points)} onChange={e => setConfig({ ...config, points: Number(e.target.value) })} />
          </>
        );

      case RuleType.event:
        return (
          <>
            <FloatingLabelInput label="Nome do evento" type="text" value={str(config.event_name)} onChange={e => setConfig({ ...config, event_name: e.target.value })} />
            <FloatingLabelInput label="Pontos" type="number" value={num(config.points)} onChange={e => setConfig({ ...config, points: Number(e.target.value) })} />
          </>
        );

      case RuleType.category:
        if (!categories.length) {
          return <div className={styles.field}><Button onClick={() => router.push('/register?section=categories')}>Cadastrar categoria</Button></div>;
        }
        return (
          <div className={styles.field}>
            <label>Categorias</label>
            <select multiple size={Math.min(categories.length, 10)} className={styles.multiSelect} value={(config.categories ?? []) as string[]} onChange={() => {}}>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id} onMouseDown={e => { e.preventDefault(); const curr = (config.categories ?? []) as string[]; const next = curr.includes(cat.id) ? curr.filter(id => id !== cat.id) : [...curr, cat.id]; setConfig({ ...config, categories: next }); }}>
                  {cat.name}
                </option>
              ))}
            </select>
            <div className={styles.paginationControls}>
              <button type="button" disabled={!catSkip} onClick={() => setCatSkip(catSkip - catLimit)}>Anterior</button>
              <span>Página {Math.floor(catSkip / catLimit) + 1} de {Math.ceil(catTotal / catLimit)}</span>
              <button type="button" disabled={catSkip + catLimit >= catTotal} onClick={() => setCatSkip(catSkip + catLimit)}>Próxima</button>
            </div>
            <div className={styles.selectedText}>{(config.categories ?? []).map(id => categories.find(c => c.id === id)?.name).filter(Boolean).join(', ') || 'Nenhuma selecionada'}</div>
            <FloatingLabelInput label="Multiplicador" type="number" value={num(config.multiplier)} onChange={e => setConfig({ ...config, multiplier: Number(e.target.value) })} />
          </div>
        );

      case RuleType.inventory:
        if (!items.length) {
          return <div className={styles.field}><Button onClick={() => router.push('/register?section=inventory')}>Cadastrar item de inventário</Button></div>;
        }
        return (
          <div className={styles.field}>
            <label>Itens de Inventário</label>            
            <div className={styles.checkboxList}>
              {items.map(item => {
                const checked = selectedItems.includes(item.id);
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
                      onChange={() =>
                        setSelectedItems(prev =>
                          checked
                            ? prev.filter(id => id !== item.id)
                            : [...prev, item.id]
                        )
                      }
                    />
                    {item.name}
                  </label>
                );
              })}

              {/* paginação dos itens */}
              {itemTotal > itemLimit && (
                <div className={styles.pagination}>
                  <button
                    onClick={goPrevPage}
                    disabled={!hasPrevPage}
                  >
                    Anterior
                  </button>
                  <span>
                    {Math.floor(itemSkip / itemLimit) + 1} /{' '}
                    {Math.ceil(itemTotal / itemLimit)}
                  </span>
                  <button
                    onClick={goNextPage}
                    disabled={!hasNextPage}
                  >
                    Próxima
                  </button>
                </div>
              )}
              

            {selectedItems.length > 0 && (
              <p className={styles.selectedHint}>
                Selecionados:&nbsp;
                {items
                  .filter(i => selectedItems.includes(i.id))
                  .map(i => i.name)
                  .join(', ')}
              </p>
            )}
            </div>
            <FloatingLabelInput label="Multiplicador" type="number" value={num(config.multiplier)} onChange={e => setConfig({ ...config, multiplier: Number(e.target.value) })} />
          </div>
        );

      case RuleType.geolocation:
        if (!branches.length) {
          return <div className={styles.field}><Button onClick={() => router.push('/register')}>Cadastrar filial</Button></div>;
        }
        return (
          <div className={styles.field}>
            <label>Filial</label>
            <select className={styles.select} value={str(config.branch_id)} onChange={e => setConfig({ ...config, branch_id: e.target.value })}>
              <option value="">Nenhuma selecionada</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <FloatingLabelInput label="Pontos" type="number" value={num(config.points)} onChange={e => setConfig({ ...config, points: Number(e.target.value) })} />
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
                // gera base slug (trim remove espaços das pontas)
                let s = slugify(raw);
                // se terminou num espaço, adiciona '-' no final
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
            {/* mínimo de 1 caractere */}
            {!(config.slug as string)?.length && (
              <div className={styles.errorText}>
                O slug precisa ter ao menos 1 caractere.
              </div>
            )}
            {checkingSlug && (
              <div className={styles.helperText}>Verificando...</div>
            )}
            {config.slug && !validateSlug(config.slug as string) && (
              <div className={styles.errorText}>
                Formato inválido. Use apenas a–z, 0–9 e hífens.
              </div>
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
              value={num(config.max_attributions)}
              onChange={e => setConfig({ ...config, max_attributions: Number(e.target.value) })}
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
      <FloatingLabelInput label="Nome" type="text" value={name} onChange={e => setName(e.target.value)} />
      <div className={styles.field}><label>Descrição</label><textarea value={description} onChange={e => setDescription(e.target.value)} className={styles.textarea} /></div>
      <div className={styles.field}><label>Tipo de Regra</label><select value={ruleType} onChange={e => setRuleType(e.target.value as RuleType)} className={styles.select}>{Object.values(RuleType).filter(rt => !hiddenRuleTypes.includes(rt)).map(rt => <option key={rt} value={rt}>{getRuleTypeLabel(rt)}</option>)}</select></div>
      <div className={styles.configSection}><h3>Configuração</h3>{renderConfigFields()}</div>
      <div className={styles.switches}><label><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Ativa</label><label><input type="checkbox" checked={visible} onChange={e => setVisible(e.target.checked)} /> Visível</label></div>
      
      <div className={styles.actions}>
        <Button
          onClick={handleSubmit}
          disabled={
            ruleType === RuleType.digital_behavior &&
            (
              !(config.slug as string)?.length || 
              !validateSlug(config.slug as string) || 
              checkingSlug ||                        
              slugAvailable === false            
            )
          }
        >
          Salvar
        </Button>

        <Button onClick={onCancel} bgColor="#f3f4f6" style={{ color: '#374151' }}>Cancelar</Button>
      </div>
    </div>
  );
}

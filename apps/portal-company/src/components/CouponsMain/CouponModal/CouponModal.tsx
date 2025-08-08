'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import styles from './CouponModal.module.css';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import Button from '@/components/Button/Button';
import Notification from '@/components/Notification/Notification';
import type { CouponRead, CouponCreate } from '@/types/coupon';
import type { ProductCategoryRead } from '@/types/productCategory';
import type { InventoryItemRead } from '@/types/inventoryItem';
import { listProductCategories } from '@/services/productCategoryService';
import { listInventoryItems } from '@/services/inventoryItemService';

// Carrega o mapa apenas no cliente (evita erro no SSR)
const MapPicker = dynamic(() => import('@/components/Map/MapPicker'), { ssr: false });

type DiscountMode = 'none' | 'percent' | 'fixed';
type OriginType = 'name' | 'map';

interface Props {
  coupon: CouponRead | null;
  onSave: (data: CouponCreate, id?: string) => void;
  onCancel: () => void;
}

export default function CouponModal({ coupon, onSave, onCancel }: Props) {
  const router = useRouter();

  /* ---------- form state básicos ---------- */
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  const [discountMode, setDiscountMode] = useState<DiscountMode>('none');
  const [discountValue, setDiscountValue] = useState<number | ''>('');

  const [usageLimitTotal, setUsageLimitTotal] = useState<number | ''>('');
  const [usageLimitPerUser, setUsageLimitPerUser] = useState<number | ''>('');
  const [minOrderAmount, setMinOrderAmount] = useState<number | ''>('');

  const [originType, setOriginType] = useState<OriginType>('name');
  const [sourceLocationName, setSourceLocationName] = useState('');
  const [sourceLat, setSourceLat] = useState<number | ''>('');
  const [sourceLng, setSourceLng] = useState<number | ''>('');

  const [descCount, setDescCount] = useState(0);
  const [notification, setNotification] = useState<{ type: string; message: string } | null>(null);

  /* ---------- categorias (paginadas) ---------- */
  const [categories, setCategories] = useState<ProductCategoryRead[]>([]);
  const [catSkip, setCatSkip] = useState(0);
  const [catLimit, setCatLimit] = useState(10);
  const [catTotal, setCatTotal] = useState(0);
  const [catLoading, setCatLoading] = useState(false);
  const [catQuery, setCatQuery] = useState('');
  const [catShowSelectedOnly, setCatShowSelectedOnly] = useState(false);
  // index para mostrar nomes nas “chips”
  const [catIndex, setCatIndex] = useState<Record<string, string>>({});

  /* ---------- itens (paginados) ---------- */
  const [items, setItems] = useState<InventoryItemRead[]>([]);
  const [itemSkip, setItemSkip] = useState(0);
  const [itemLimit, setItemLimit] = useState(10);
  const [itemTotal, setItemTotal] = useState(0);
  const [itemLoading, setItemLoading] = useState(false);
  const [itemQuery, setItemQuery] = useState('');
  const [itemShowSelectedOnly, setItemShowSelectedOnly] = useState(false);
  const [itemIndex, setItemIndex] = useState<Record<string, string>>({});

  /* ---------- selecionados ---------- */
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  /* ---------- draft ---------- */
  const DRAFT_KEY = useMemo(() => `couponModalDraft-${coupon?.id ?? 'new'}`, [coupon?.id]);
  const isFirstRun = useRef(true);

  /* ---------- helpers ---------- */
  const normalize = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const toShortId = (id: string) => id.slice(0, 8) + '…';

  const hasPrevCat = catSkip > 0;
  const hasNextCat = catSkip + catLimit < catTotal;
  const hasPrevItem = itemSkip > 0;
  const hasNextItem = itemSkip + itemLimit < itemTotal;

  /* ---------- init (cupom/draft) ---------- */
  useEffect(() => {
    isFirstRun.current = true;

    if (coupon) {
      setName(coupon.name);
      setCode(coupon.code);
      setDescription(coupon.description ?? '');
      setIsActive(coupon.is_active);
      setIsVisible(coupon.is_visible);

      if (coupon.discount_type && coupon.discount_value != null) {
        setDiscountMode(coupon.discount_type as DiscountMode);
        setDiscountValue(coupon.discount_value);
      } else {
        setDiscountMode('none');
        setDiscountValue('');
      }

      setUsageLimitTotal(coupon.usage_limit_total ?? '');
      setUsageLimitPerUser(coupon.usage_limit_per_user ?? '');
      setMinOrderAmount(coupon.min_order_amount ?? '');

      setSelectedCategories(coupon.category_ids ?? []);
      setSelectedItems(coupon.item_ids ?? []);

      setSourceLocationName(coupon.source_location_name ?? '');
      setSourceLat(coupon.source_lat ?? '');
      setSourceLng(coupon.source_lng ?? '');
      setOriginType(coupon.source_lat != null && coupon.source_lng != null ? 'map' : 'name');

      setDescCount((coupon.description ?? '').length);
    } else {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        try {
          const d = JSON.parse(draft);
          setName(d.name ?? '');
          setCode(d.code ?? '');
          setDescription(d.description ?? '');
          setIsActive(d.isActive ?? true);
          setIsVisible(d.isVisible ?? true);
          setDiscountMode(d.discountMode ?? 'none');
          setDiscountValue(d.discountValue ?? '');
          setUsageLimitTotal(d.usageLimitTotal ?? '');
          setUsageLimitPerUser(d.usageLimitPerUser ?? '');
          setMinOrderAmount(d.minOrderAmount ?? '');
          setOriginType(d.originType ?? 'name');
          setSourceLocationName(d.sourceLocationName ?? '');
          setSourceLat(d.sourceLat ?? '');
          setSourceLng(d.sourceLng ?? '');
          setSelectedCategories(Array.isArray(d.selectedCategories) ? d.selectedCategories : []);
          setSelectedItems(Array.isArray(d.selectedItems) ? d.selectedItems : []);
          setDescCount((d.description ?? '').length);
        } catch {
          /* ignore */
        }
      }
    }
  }, [coupon, DRAFT_KEY]);

  /* ---------- fetch categorias ---------- */
  useEffect(() => {
    let mounted = true;
    (async () => {
      setCatLoading(true);
      try {
        const res = await listProductCategories(catSkip, catLimit);
        if (!mounted) return;
        setCategories(res.data.items);
        setCatTotal(res.data.total);
        setCatIndex(prev => {
          const next = { ...prev };
          res.data.items.forEach(c => { next[c.id] = c.name; });
          return next;
        });
      } finally {
        if (mounted) setCatLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [catSkip, catLimit]);

  /* ---------- fetch itens ---------- */
  useEffect(() => {
    let mounted = true;
    (async () => {
      setItemLoading(true);
      try {
        const res = await listInventoryItems(itemSkip, itemLimit);
        if (!mounted) return;
        setItems(res.data.items);
        setItemTotal(res.data.total);
        setItemIndex(prev => {
          const next = { ...prev };
          res.data.items.forEach(i => { next[i.id] = i.name; });
          return next;
        });
      } finally {
        if (mounted) setItemLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [itemSkip, itemLimit]);

  /* ---------- salvar draft ---------- */
  useEffect(() => {
    if (coupon) return;
    if (isFirstRun.current) { isFirstRun.current = false; return; }
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        name, code, description, isActive, isVisible,
        discountMode, discountValue,
        usageLimitTotal, usageLimitPerUser, minOrderAmount,
        originType, sourceLocationName, sourceLat, sourceLng,
        selectedCategories, selectedItems
      })
    );
  }, [
    DRAFT_KEY, coupon,
    name, code, description, isActive, isVisible,
    discountMode, discountValue,
    usageLimitTotal, usageLimitPerUser, minOrderAmount,
    originType, sourceLocationName, sourceLat, sourceLng,
    selectedCategories, selectedItems
  ]);

  /* ---------- filtros (client-side na página atual) ---------- */
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

  /* ---------- submit ---------- */
  const handleDescChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v.length <= 200) { setDescription(v); setDescCount(v.length); }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!name || !code) {
      setNotification({ type: 'error', message: 'Preencha Nome e Código do cupom.' });
      return;
    }

    if (discountMode !== 'none') {
      if (discountValue === '' || isNaN(Number(discountValue))) {
        setNotification({ type: 'error', message: 'Informe um valor de desconto válido.' });
        return;
      }
      const val = Number(discountValue);
      if (discountMode === 'percent' && (val < 0 || val > 100)) {
        setNotification({ type: 'error', message: 'Percentual deve estar entre 0 e 100.' });
        return;
      }
      if (discountMode === 'fixed' && val < 0) {
        setNotification({ type: 'error', message: 'Valor fixo não pode ser negativo.' });
        return;
      }
    }

    if (originType === 'name') {
      if (!sourceLocationName.trim()) {
        setNotification({ type: 'error', message: 'Informe o nome do local de origem.' });
        return;
      }
    } else {
      if (sourceLat === '' || sourceLng === '' || isNaN(Number(sourceLat)) || isNaN(Number(sourceLng))) {
        setNotification({ type: 'error', message: 'Selecione um ponto no mapa ou informe Lat/Lng válidos.' });
        return;
      }
    }

    const payload: CouponCreate = {
      name, code,
      description: description || undefined,
      is_active: isActive,
      is_visible: isVisible,
      usage_limit_total: usageLimitTotal === '' ? undefined : Number(usageLimitTotal),
      usage_limit_per_user: usageLimitPerUser === '' ? undefined : Number(usageLimitPerUser),
      min_order_amount: minOrderAmount === '' ? undefined : Number(minOrderAmount),
      discount_type: discountMode === 'none' ? undefined : discountMode,
      discount_value: discountMode === 'none' ? undefined : (discountValue === '' ? undefined : Number(discountValue)),
      category_ids: selectedCategories.length ? selectedCategories : undefined,
      item_ids: selectedItems.length ? selectedItems : undefined,
      source_location_name: originType === 'name' ? sourceLocationName : undefined,
      source_lat: originType === 'map' ? Number(sourceLat) : undefined,
      source_lng: originType === 'map' ? Number(sourceLng) : undefined,
    };

    onSave(payload, coupon?.id);
    localStorage.removeItem(DRAFT_KEY);
  };

  const discountLabel = useMemo(() => {
    if (discountMode === 'none') return 'Sem desconto';
    if (discountMode === 'percent') return 'Percentual (%)';
    return 'Valor fixo (R$)';
  }, [discountMode]);

  /* ---------- UI actions (seleção) ---------- */
  const toggleCat = (id: string) => {
    setSelectedCategories(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleItem = (id: string) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAllCatsPage = () => {
    const ids = filteredCats.map(c => c.id);
    setSelectedCategories(prev => Array.from(new Set([...prev, ...ids])));
  };
  const clearAllCats = () => setSelectedCategories([]);

  const selectAllItemsPage = () => {
    const ids = filteredItems.map(i => i.id);
    setSelectedItems(prev => Array.from(new Set([...prev, ...ids])));
  };
  const clearAllItems = () => setSelectedItems([]);

  /* ---------- render ---------- */
  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.title}>{coupon ? 'Editar Cupom' : 'Novo Cupom'}</h2>

      {notification && (
        <Notification
          type={notification.type as 'error'}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <FloatingLabelInput id="coupon-name" name="name" label="Nome" type="text" value={name} onChange={e => setName(e.target.value)} />
      <FloatingLabelInput id="coupon-code" name="code" label="Código" type="text" value={code} onChange={e => setCode(e.target.value)} />
      <FloatingLabelInput id="coupon-description" name="description" label="Descrição" type="text" value={description} onChange={handleDescChange} />
      <div className={styles.charCount}>{descCount}/200 caracteres</div>

      <div className={styles.switches}>
        <label><input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} /> Ativo</label>
        <label><input type="checkbox" checked={isVisible} onChange={e => setIsVisible(e.target.checked)} /> Visível</label>
      </div>

      {/* Desconto */}
      <div className={styles.optionGroup} role="radiogroup" aria-label="Tipo de desconto">
        <button type="button" role="radio" aria-checked={discountMode === 'none'} className={`${styles.option} ${discountMode === 'none' ? styles.optionSelected : ''}`} onClick={() => setDiscountMode('none')}>Sem desconto</button>
        <button type="button" role="radio" aria-checked={discountMode === 'percent'} className={`${styles.option} ${discountMode === 'percent' ? styles.optionSelected : ''}`} onClick={() => setDiscountMode('percent')}>Percentual</button>
        <button type="button" role="radio" aria-checked={discountMode === 'fixed'} className={`${styles.option} ${discountMode === 'fixed' ? styles.optionSelected : ''}`} onClick={() => setDiscountMode('fixed')}>Valor fixo</button>
      </div>

      {discountMode !== 'none' && (
        <FloatingLabelInput
          id="coupon-discount"
          name="discount_value"
          label={discountLabel}
          type="number"
          value={discountValue === '' ? '' : String(discountValue)}
          onChange={e => setDiscountValue(e.target.value === '' ? '' : Number(e.target.value))}
          min={0}
          max={discountMode === 'percent' ? 100 : undefined}
          step="0.01"
        />
      )}

      <div className={styles.grid2}>
        <FloatingLabelInput id="coupon-usage-total" name="usage_limit_total" label="Limite total de usos" type="number" value={usageLimitTotal === '' ? '' : String(usageLimitTotal)} onChange={e => setUsageLimitTotal(e.target.value === '' ? '' : Number(e.target.value))} min={0} />
        <FloatingLabelInput id="coupon-usage-user" name="usage_limit_per_user" label="Limite por usuário" type="number" value={usageLimitPerUser === '' ? '' : String(usageLimitPerUser)} onChange={e => setUsageLimitPerUser(e.target.value === '' ? '' : Number(e.target.value))} min={0} />
      </div>

      <FloatingLabelInput id="coupon-min-order" name="min_order_amount" label="Valor mínimo de pedido (R$)" type="number" value={minOrderAmount === '' ? '' : String(minOrderAmount)} onChange={e => setMinOrderAmount(e.target.value === '' ? '' : Number(e.target.value))} min={0} step="0.01" />

      {/* -------------------- CATEGORIAS -------------------- */}
      <section className={styles.selectSection}>
        <header className={styles.selectHeader}>
          <h3>Categorias <span className={styles.countChip}>{selectedCategories.length}</span></h3>
          <div className={styles.selectTools}>
            <input className={styles.searchInput} placeholder="Buscar categoria..." value={catQuery} onChange={e => setCatQuery(e.target.value)} />
            <label className={styles.inlineToggle}>
              <input type="checkbox" checked={catShowSelectedOnly} onChange={e => setCatShowSelectedOnly(e.target.checked)} />
              Mostrar só selecionadas
            </label>
            <button type="button" className={styles.miniBtn} onClick={selectAllCatsPage} disabled={!filteredCats.length}>Selecionar tudo (página)</button>
            <button type="button" className={styles.miniBtn} onClick={clearAllCats} disabled={!selectedCategories.length}>Limpar seleção</button>
          </div>
        </header>

        {!catLoading && !categories.length ? (
          <div className={styles.emptyBlock}>
            <p>Você ainda não cadastrou nenhuma categoria.</p>
            <Button onClick={() => router.push('/register?section=categories')}>Cadastrar categoria</Button>
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
                    className={`${styles.cardOption} ${selectedCategories.includes(c.id) ? styles.cardOptionChecked : ''}`}
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
                <button type="button" disabled={!hasPrevCat || catLoading} onClick={() => !catLoading && setCatSkip(prev => Math.max(prev - catLimit, 0))}>Anterior</button>
                <span>Página {Math.floor(catSkip / catLimit) + 1} de {Math.max(1, Math.ceil(catTotal / catLimit))}</span>
                <button type="button" disabled={!hasNextCat || catLoading} onClick={() => !catLoading && setCatSkip(prev => prev + catLimit)}>Próxima</button>
                <select className={styles.pageSize} value={catLimit} onChange={e => { setCatSkip(0); setCatLimit(Number(e.target.value)); }}>
                  {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}/página</option>)}
                </select>
              </div>

              {selectedCategories.length > 0 && (
                <div className={styles.chips}>
                  {selectedCategories.map(id => (
                    <span key={id} className={styles.chip}>
                      {catIndex[id] || toShortId(id)}
                      <button type="button" aria-label="Remover" onClick={() => toggleCat(id)}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </footer>
          </>
        )}
      </section>

      {/* -------------------- ITENS DE INVENTÁRIO -------------------- */}
      <section className={styles.selectSection}>
        <header className={styles.selectHeader}>
          <h3>Itens de inventário <span className={styles.countChip}>{selectedItems.length}</span></h3>
          <div className={styles.selectTools}>
            <input className={styles.searchInput} placeholder="Buscar item..." value={itemQuery} onChange={e => setItemQuery(e.target.value)} />
            <label className={styles.inlineToggle}>
              <input type="checkbox" checked={itemShowSelectedOnly} onChange={e => setItemShowSelectedOnly(e.target.checked)} />
              Mostrar só selecionados
            </label>
            <button type="button" className={styles.miniBtn} onClick={selectAllItemsPage} disabled={!filteredItems.length}>Selecionar tudo (página)</button>
            <button type="button" className={styles.miniBtn} onClick={clearAllItems} disabled={!selectedItems.length}>Limpar seleção</button>
          </div>
        </header>

        {!itemLoading && !items.length ? (
          <div className={styles.emptyBlock}>
            <p>Você ainda não cadastrou nenhum item de inventário.</p>
            <Button onClick={() => router.push('/register?section=inventory')}>Cadastrar item de inventário</Button>
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
                    className={`${styles.cardOption} ${selectedItems.includes(i.id) ? styles.cardOptionChecked : ''}`}
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
                <button type="button" disabled={!hasPrevItem || itemLoading} onClick={() => !itemLoading && setItemSkip(prev => Math.max(prev - itemLimit, 0))}>Anterior</button>
                <span>Página {Math.floor(itemSkip / itemLimit) + 1} de {Math.max(1, Math.ceil(itemTotal / itemLimit))}</span>
                <button type="button" disabled={!hasNextItem || itemLoading} onClick={() => !itemLoading && setItemSkip(prev => prev + itemLimit)}>Próxima</button>
                <select className={styles.pageSize} value={itemLimit} onChange={e => { setItemSkip(0); setItemLimit(Number(e.target.value)); }}>
                  {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}/página</option>)}
                </select>
              </div>

              {selectedItems.length > 0 && (
                <div className={styles.chips}>
                  {selectedItems.map(id => (
                    <span key={id} className={styles.chip}>
                      {itemIndex[id] || toShortId(id)}
                      <button type="button" aria-label="Remover" onClick={() => toggleItem(id)}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </footer>
          </>
        )}
      </section>

      {/* -------------------- ORIGEM -------------------- */}
      <div className={styles.optionGroup} role="radiogroup" aria-label="Tipo de origem">
        <button type="button" role="radio" aria-checked={originType === 'name'} className={`${styles.option} ${originType === 'name' ? styles.optionSelected : ''}`} onClick={() => setOriginType('name')}>Origem por Nome</button>
        <button type="button" role="radio" aria-checked={originType === 'map'} className={`${styles.option} ${originType === 'map' ? styles.optionSelected : ''}`} onClick={() => setOriginType('map')}>Origem por Mapa (Lat/Lng)</button>
      </div>

      {originType === 'name' ? (
        <FloatingLabelInput id="coupon-source-name" name="source_location_name" label="Local de origem (nome)" type="text" value={sourceLocationName} onChange={e => setSourceLocationName(e.target.value)} />
      ) : (
        <>
          <div className={styles.mapBlock}>
            <MapPicker
              lat={typeof sourceLat === 'number' ? sourceLat : null}
              lng={typeof sourceLng === 'number' ? sourceLng : null}
              onChange={(lat, lng, displayName) => {
                setSourceLat(lat);
                setSourceLng(lng);
                if (displayName) setSourceLocationName(displayName);
              }}
            />
          </div>
          <div className={styles.grid2}>
            <FloatingLabelInput id="coupon-source-lat" name="source_lat" label="Latitude" type="number" value={sourceLat === '' ? '' : String(sourceLat)} onChange={e => setSourceLat(e.target.value === '' ? '' : Number(e.target.value))} step="0.000001" />
            <FloatingLabelInput id="coupon-source-lng" name="source_lng" label="Longitude" type="number" value={sourceLng === '' ? '' : String(sourceLng)} onChange={e => setSourceLng(e.target.value === '' ? '' : Number(e.target.value))} step="0.000001" />
          </div>
          <FloatingLabelInput id="coupon-source-resolved-name" name="source_resolved_name" label="Local selecionado (opcional)" type="text" value={sourceLocationName} onChange={e => setSourceLocationName(e.target.value)} />
        </>
      )}

      <div className={styles.actions}>
        <Button type="submit">Salvar</Button>
        <Button bgColor="#AAA" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}

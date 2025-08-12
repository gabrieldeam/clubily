'use client';

import { FormEvent, useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styles from './InventoryItemModal.module.css';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import Button from '@/components/Button/Button';
import Notification from '@/components/Notification/Notification';

import { listProductCategories } from '@/services/productCategoryService';
import type {
  ProductCategoryRead,
  PaginatedProductCategories,
} from '@/types/productCategory';
import type { InventoryItemRead, InventoryItemCreate } from '@/types/inventoryItem';

interface Props {
  item: InventoryItemRead | null;
  onSave: (data: InventoryItemCreate, id?: string) => void;
  onCancel: () => void;
}

const DRAFT_KEY = 'inventoryItemModalDraft';

export default function InventoryItemModal({ item, onSave, onCancel }: Props) {
  const [sku, setSku] = useState('');
  const isFirstRun = useRef(true);
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const selectedSet = useMemo(() => new Set(selectedCats), [selectedCats]);

  const router = useRouter();
  const [categories, setCategories] = useState<ProductCategoryRead[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [catSkip, setCatSkip] = useState(0);
  const catLimit = 10;
  const [catTotal, setCatTotal] = useState(0);
  const [notification, setNotification] =
    useState<{ type: 'error'; message: string } | null>(null);

  // 1) fetch categorias
  useEffect(() => {
    setLoadingCats(true);
    listProductCategories(catSkip, catLimit)
      .then(res => {
        const data: PaginatedProductCategories = res.data;
        setCategories(data.items);
        setCatTotal(data.total);
      })
      .catch(console.error)
      .finally(() => setLoadingCats(false));
  }, [catSkip]);

  // 2) inicialização / restauração do rascunho
  useEffect(() => {
    if (item) {
      setSku(item.sku);
      setName(item.name);
      setPrice(item.price);
      setSelectedCats(item.category_ids ?? []);
    } else {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        try {
          const { sku: s, name: n, price: p, selectedCats: sc } = JSON.parse(draft);
          setSku(s ?? '');
          setName(n ?? '');
          setPrice(typeof p === 'number' ? p : 0);
          setSelectedCats(Array.isArray(sc) ? sc : []);
        } catch {
          setSku(''); setName(''); setPrice(0); setSelectedCats([]);
        }
      } else {
        setSku(''); setName(''); setPrice(0); setSelectedCats([]);
      }
      setNotification(null);
    }
  }, [item]);

  // 3) salvamento automático do rascunho
  useEffect(() => {
    if (item) return;
    if (isFirstRun.current) { isFirstRun.current = false; return; }
    if (sku.trim() || name.trim() || price !== 0 || selectedCats.length > 0) {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ sku: sku.trim(), name: name.trim(), price, selectedCats })
      );
    }
  }, [sku, name, price, selectedCats, item]);

  const toggleCategory = (id: string) => {
    setSelectedCats(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim() || price < 0) {
      setNotification({ type: 'error', message: 'Preencha todos os campos corretamente.' });
      return;
    }
    onSave(
      { sku: sku.trim(), name: name.trim(), price, category_ids: selectedCats },
      item?.id
    );
    if (!item) localStorage.removeItem(DRAFT_KEY);
  };

  const handleCancel = () => {
    if (!item) localStorage.removeItem(DRAFT_KEY);
    onCancel();
  };

  const canPrev = catSkip > 0;
  const canNext = catSkip + catLimit < catTotal;

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.title}>{item ? 'Editar Item' : 'Novo Item'}</h2>

      {notification && (
        <Notification
          type="error"
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <FloatingLabelInput
        id="item-sku"
        label="SKU"
        value={sku}
        onChange={e => setSku(e.target.value)}
      />

      <FloatingLabelInput
        id="item-name"
        label="Nome do produto"
        value={name}
        onChange={e => setName(e.target.value)}
      />

      <FloatingLabelInput
        id="item-price"
        label="Preço"
        type="number"
        value={price.toString()}
        onChange={e => setPrice(e.target.value === '' ? 0 : parseFloat(e.target.value))}
      />

      <div className={styles.catSection}>
        <label className={styles.catLabel}>Categorias</label>

        {loadingCats ? (
          <p>Carregando categorias...</p>
        ) : categories.length > 0 ? (
          <>
            <div className={styles.catList}>
              {categories.map(cat => (
                <label key={cat.id} className={styles.catItem}>
                  <input
                    type="checkbox"
                    checked={selectedSet.has(cat.id)}
                    onChange={() => toggleCategory(cat.id)}
                  />
                  <span>{cat.name}</span>
                </label>
              ))}
            </div>

            <div className={styles.pagination}>
              <button
                type="button"
                onClick={() => setCatSkip(s => Math.max(0, s - catLimit))}
                disabled={!canPrev}
              >
                Anterior
              </button>
              <span>
                Página {catSkip / catLimit + 1} de {Math.ceil(catTotal / catLimit)}
              </span>
              <button
                type="button"
                onClick={() => setCatSkip(s => s + catLimit)}
                disabled={!canNext}
              >
                Próxima
              </button>
            </div>

            
            {/* {selectedCats.length > 0 && (
              <div className={styles.selectedChips}>
                {selectedCats.map(id => (
                  <span key={id} className={styles.chip}>
                    {categories.find(c => c.id === id)?.name ?? id}
                  </span>
                ))}
              </div>
            )} */}
          </>
        ) : (
          <div className={styles.noCategories}>
            <p>Nenhuma categoria encontrada.</p>
            <Button type="button" onClick={() => router.push('/register?section=categories')}>
              Cadastrar Categoria
            </Button>
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <Button type="submit">{item ? 'Salvar' : 'Criar'}</Button>
        <Button bgColor="#AAA" onClick={handleCancel}>Cancelar</Button>
      </div>
    </form>
  );
}

// /components/InventoryItemsMain/InventoryItemModal/InventoryItemModal.tsx
'use client';

import { FormEvent, useState, useEffect } from 'react';
import styles from './InventoryItemModal.module.css';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import Button from '@/components/Button/Button';
import Notification from '@/components/Notification/Notification';

import {
  listProductCategories
} from '@/services/productCategoryService';
import type { ProductCategoryRead } from '@/types/productCategory';
import type { InventoryItemRead, InventoryItemCreate } from '@/types/inventoryItem';

interface Props {
  item: InventoryItemRead | null;
  onSave: (data: InventoryItemCreate, id?: string) => void;
  onCancel: () => void;
}

export default function InventoryItemModal({ item, onSave, onCancel }: Props) {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [categories, setCategories] = useState<ProductCategoryRead[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [notification, setNotification] = useState<{type:'error';message:string} | null>(null);

  useEffect(() => {
    listProductCategories()
      .then(res => setCategories(res.data))
      .finally(() => setLoadingCats(false));
  }, []);

  useEffect(() => {
    if (item) {
      setSku(item.sku);
      setName(item.name);
      setPrice(item.price);
      setSelectedCats(item.category_ids);
    } else {
      setSku(''); setName(''); setPrice(0); setSelectedCats([]);
      setNotification(null);
    }
  }, [item]);

  const toggleCategory = (id: string) => {
    setSelectedCats(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim() || price < 0) {
      setNotification({ type: 'error', message: 'Preencha todos os campos corretamente.' });
      return;
    }
    onSave({ sku: sku.trim(), name: name.trim(), price, category_ids: selectedCats }, item?.id);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.title}>
        {item ? 'Editar Item' : 'Novo Item'}
      </h2>

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
        label="Nome"
        value={name}
        onChange={e => setName(e.target.value)}
      />

      <FloatingLabelInput
        id="item-price"
        label="Preço"
        type="number"
        value={price.toString()}
        onChange={e => setPrice(parseFloat(e.target.value))}
      />

      <div className={styles.catSection}>
        <label className={styles.catLabel}>Categorias:</label>
        {loadingCats ? (
          <p>Carregando categorias...</p>
        ) : (
          <div className={styles.catList}>
            {categories.map(cat => (
              <label key={cat.id} className={styles.catItem}>
                <input
                  type="checkbox"
                  checked={selectedCats.includes(cat.id)}
                  onChange={() => toggleCategory(cat.id)}
                />
                <span>{cat.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <Button type="submit">{item ? 'Salvar' : 'Criar'}</Button>
        <Button bgColor="#AAA" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}

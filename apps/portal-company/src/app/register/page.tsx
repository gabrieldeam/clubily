'use client';

import { useState } from 'react';
import Header from '@/components/Header/Header';
import BranchesMain from '@/components/BranchesMain/BranchesMain';
import ProductCategoriesMain from '@/components/ProductCategoriesMain/ProductCategoriesMain';
import InventoryItemsMain from '@/components/InventoryItemsMain/InventoryItemsMain';
import { GitBranch, Tag, Box } from 'lucide-react';
import styles from './page.module.css';

type Section = 'branches' | 'categories' | 'inventory';

export default function RegistrosPage() {
  const [section, setSection] = useState<Section>('branches');

  return (
    <>
      <Header />

      <div className={styles.layout}>
        <nav className={styles.sidebar}>
          <button
            className={section === 'branches' ? styles.active : ''}
            onClick={() => setSection('branches')}
          >
            <GitBranch size={16} /> Filiais
          </button>
          <button
            className={section === 'categories' ? styles.active : ''}
            onClick={() => setSection('categories')}
          >
            <Tag size={16} /> Categorias
          </button>
          <button
            className={section === 'inventory' ? styles.active : ''}
            onClick={() => setSection('inventory')}
          >
            <Box size={16} /> Inventário
          </button>
        </nav>

        <main className={styles.content}>
          {section === 'branches' && <BranchesMain />}
          {section === 'categories' && <ProductCategoriesMain />}
          {section === 'inventory' && <InventoryItemsMain />}
        </main>
      </div>
    </>
  );
}

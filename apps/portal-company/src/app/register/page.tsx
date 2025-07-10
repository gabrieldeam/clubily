'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import Header from '@/components/Header/Header';
import BranchesMain from '@/components/BranchesMain/BranchesMain';
import ProductCategoriesMain from '@/components/ProductCategoriesMain/ProductCategoriesMain';
import InventoryItemsMain from '@/components/InventoryItemsMain/InventoryItemsMain';
import { GitBranch, Tag, Box } from 'lucide-react';
import styles from './page.module.css';

type Section = 'branches' | 'categories' | 'inventory';
const VALID_SECTIONS: Section[] = ['branches', 'categories', 'inventory'];

export default function RegistrosPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // derive initial from URL, fallback to 'branches'
  const param = searchParams.get('section');
  const initial: Section = VALID_SECTIONS.includes(param as Section)
    ? (param as Section)
    : 'branches';

  const [section, setSection] = useState<Section>(initial);

  // sync state → URL (replace so you don't bloat history)
  const switchSection = (newSection: Section) => {
    setSection(newSection);
    const qp = new URLSearchParams(searchParams as any);
    qp.set('section', newSection);
    router.replace(`${pathname}?${qp.toString()}`);
  };

  // if user manually edits URL, keep state in sync
  useEffect(() => {
    if (param && VALID_SECTIONS.includes(param as Section) && param !== section) {
      setSection(param as Section);
    }
  }, [param, section]);

  return (
    <>
      <Header />

      <div className={styles.layout}>
        <nav className={styles.sidebar}>
          <button
            className={section === 'branches' ? styles.active : ''}
            onClick={() => switchSection('branches')}
          >
            <GitBranch size={16} /> Filiais
          </button>

          <button
            className={section === 'categories' ? styles.active : ''}
            onClick={() => switchSection('categories')}
          >
            <Tag size={16} /> Categorias
          </button>

          <button
            className={section === 'inventory' ? styles.active : ''}
            onClick={() => switchSection('inventory')}
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

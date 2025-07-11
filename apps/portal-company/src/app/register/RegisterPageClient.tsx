'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import Header from '@/components/Header/Header';
import BranchesMain from '@/components/BranchesMain/BranchesMain';
import ProductCategoriesMain from '@/components/ProductCategoriesMain/ProductCategoriesMain';
import InventoryItemsMain from '@/components/InventoryItemsMain/InventoryItemsMain';
import { GitBranch, Tag, Box } from 'lucide-react';
import styles from './page.module.css';

type Section = 'branches' | 'categories' | 'inventory';
const VALID_SECTIONS: Section[] = ['branches', 'categories', 'inventory'];

export default function RegistrosPageClient() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // pega parâmetro 'section' da URL
  const paramValue = searchParams.get('section');
  let initialSection: Section = 'branches';
  if (paramValue && VALID_SECTIONS.includes(paramValue as Section)) {
    initialSection = paramValue as Section;
  }

  const [section, setSection] = useState<Section>(initialSection);

  // atualiza URL sem empilhar histórico
  const switchSection = (newSection: Section) => {
    setSection(newSection);
    const qp = new URLSearchParams(searchParams.toString());
    qp.set('section', newSection);
    router.replace(`${pathname}?${qp.toString()}`);
  };

  // mantém state em sincronia quando o usuário edita a URL manualmente
  useEffect(() => {
    const manual = searchParams.get('section');
    if (manual && VALID_SECTIONS.includes(manual as Section) && manual !== section) {
      setSection(manual as Section);
    }
  }, [searchParams, section]);

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

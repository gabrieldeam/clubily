'use client';

import React, { useMemo } from 'react';
import { Category } from '@/types/categoryBlog';
import styles from './CategorySection.module.css';

type CategoryWithChildren = Category & { children: CategoryWithChildren[] };

interface CategorySectionProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

/** Constrói uma árvore a partir de flat list */
function buildCategoryTree(categories: Category[]): CategoryWithChildren[] {
  const map = new Map<string, CategoryWithChildren>();
  const roots: CategoryWithChildren[] = [];

  categories.forEach(cat => map.set(cat.id, { ...cat, children: [] }));

  map.forEach(node => {
    if (node.parent_id) {
      const parent = map.get(node.parent_id);
      parent ? parent.children.push(node) : roots.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

/** Renderiza nó (recursivo) */
function CategoryNode({
  node,
  selectedCategoryId,
  onSelectCategory
}: {
  node: CategoryWithChildren;
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
}) {
  const isSelected = selectedCategoryId === node.id;

  return (
    <li className={styles.categoryItem}>
      <button
        type="button"
        className={`${styles.categoryLink} ${isSelected ? styles.selected : ''}`}
        onClick={() => onSelectCategory(node.id)}
      >
        {node.name}
        {node.children.length > 0 && <span className={styles.hasChildren}>▼</span>}
      </button>

      {node.children.length > 0 && (
        <ul className={styles.subCategoryList}>
          {node.children.map(child => (
            <CategoryNode
              key={child.id}
              node={child}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={onSelectCategory}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function CategorySection({
  categories,
  selectedCategoryId,
  onSelectCategory
}: CategorySectionProps) {
  const tree = useMemo(() => buildCategoryTree(categories), [categories]);

  return (
    <div className={styles.categorySection}>
      <h3 className={styles.categoryTitle}>Categorias</h3>
      <ul className={styles.categoryList}>
        {/* Botão “Todas” */}
        <li className={styles.categoryItem}>
          <button
            type="button"
            className={`${styles.categoryLink} ${selectedCategoryId === null ? styles.selected : ''}`}
            onClick={() => onSelectCategory(null)}
          >
            Todas
          </button>
        </li>

        {/* Árvore de categorias */}
        {tree.map(root => (
          <CategoryNode
            key={root.id}
            node={root}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={onSelectCategory}
          />
        ))}
      </ul>
    </div>
  );
}

// src/app/store/search/page.tsx
import { Suspense } from 'react';
import Header from '@/components/Header/Header';
import ProductSearchClient from './ProductSearchClient';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

type SearchPageProps = {
  /* Next aceita qualquer coisa aqui (até Promise).  
     Usamos `any` e silenciamos o lint só nestas duas linhas. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  searchParams?: any;
};

export default function ProductSearchPage({ searchParams }: SearchPageProps) {
  const q = (searchParams?.name ?? '').trim();

  return (
    <>
      <Header
        onSearch={(str) =>
          window.location.assign(
            `/store/search?name=${encodeURIComponent(str)}`,
          )
        }
      />

      <div className={styles.container}>
        <section className={styles.allProductsSection}>
          <h2 className={styles.allProductsHeader}>
            Resultados para “{q}”
          </h2>

          <Suspense fallback={<p>Carregando resultados…</p>}>
            <ProductSearchClient q={q} />
          </Suspense>
        </section>
      </div>
    </>
  );
}

import { Suspense } from 'react';
import SearchAuthWrapper from './SearchAuthWrapper';
import SearchClient from './SearchClient';
import styles from './page.module.css';

// Evita SSG/ISR e mantém a página 100 % dinâmica
export const dynamic = 'force-dynamic';

export default function SearchResultsPage() {
  return (
    <SearchAuthWrapper>
      <div className={styles.container}>
        <h3>Resultados da Busca</h3>

        {/* Todo o conteúdo interativo vem do Client Component */}
        <Suspense fallback={<p>Carregando resultados…</p>}>
          <SearchClient />
        </Suspense>
      </div>
    </SearchAuthWrapper>
  );
}

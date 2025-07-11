import { Suspense } from 'react';
import TransactionsPageClient from './TransactionsPageClient';

export default function TransactionsPage() {
  return (
    // 👇 Obriga o “bailout” para Client-side rendering quando useSearchParams é usado
    <Suspense fallback={<div style={{ padding: 24 }}>Carregando extrato…</div>}>
      <TransactionsPageClient />
    </Suspense>
  );
}

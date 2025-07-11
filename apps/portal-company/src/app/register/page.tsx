import { Suspense } from 'react';
import RegisterPageClient from './RegisterPageClient';

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Carregando…</div>}>
      <RegisterPageClient />
    </Suspense>
  );
}

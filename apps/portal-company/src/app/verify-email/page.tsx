import { Suspense } from 'react';
import VerifyEmailCompanyClient from './VerifyEmailCompanyClient';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Verificando…</div>}>
      <VerifyEmailCompanyClient />
    </Suspense>
  );
}

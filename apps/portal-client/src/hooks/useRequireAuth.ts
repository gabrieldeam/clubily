// src/hooks/useRequireAuth.ts
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

/**
 * Se não houver usuário autenticado redireciona para '/'.
 * - Retorna `loading` para que o componente possa exibir
 *   um spinner enquanto o contexto ainda está carregando.
 */
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/');
  }, [user, loading, router]);

  return { user, loading };
}

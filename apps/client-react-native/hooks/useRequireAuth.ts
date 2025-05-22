// src/hooks/useRequireAuth.ts
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

/**
 * Se não houver usuário autenticado, redireciona para a rota /login.
 * Retorna { user, loading } para que você possa mostrar um loading UI.
 */
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // em Next era '/', aqui vamos para a rota de login
      router.replace('/');
    }
  }, [loading, user, router]);

  return { user, loading };
}

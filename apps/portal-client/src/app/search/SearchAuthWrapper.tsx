'use client';

import type { ReactNode } from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';

type SearchAuthWrapperProps = {
  children: ReactNode;
};

export default function SearchAuthWrapper({ children }: SearchAuthWrapperProps) {
  const { loading } = useRequireAuth();
  if (loading) return null;
  return <>{children}</>;
}

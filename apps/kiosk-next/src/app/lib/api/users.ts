// apps/portal-next/src/lib/api/users.ts
import api from './client';

export interface UserRead {
  id: string;
  name?: string;
  email?: string;
  company_ids: string[];
  phone?: string;
  role: 'admin' | 'user';
}

export const getMe = () =>
  api.get<UserRead>('/me');

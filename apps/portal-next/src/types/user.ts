export type Role = 'admin' | 'user';

export interface UserRead {
  id: string;
  name: string;
  email: string;
  company_ids: string[];
  phone?: string;
  role: Role;
}

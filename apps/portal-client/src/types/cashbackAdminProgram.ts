// src/types/cashbackProgram.ts

/** Informações básicas da empresa (admin) */
export interface AdminCompanyBasic {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cnpj: string;
}

/** Informações básicas do usuário (admin) */
export interface AdminUserBasic {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone?: string;
}


/** Programa de cashback no admin */
export interface AdminProgramRead {
  id: string;
  name: string;
  description: string;
  percent: number;
  validity_days: number;
  is_active: boolean;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  company: AdminCompanyBasic;
}

/** Paginado de programas de cashback (admin) */
export interface PaginatedAdminPrograms {
  total: number;
  skip: number;
  limit: number;
  items: AdminProgramRead[];
}

/** Associação detalhada paginada de um programa */
export interface ProgramUsageAssociation {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  amount_spent: number;
  cashback_value: number;
  assigned_at: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

/** Paginação de associações de programa */
export interface PaginatedAssociations {
  total: number;
  skip: number;
  limit: number;
  items: ProgramUsageAssociation[];
}
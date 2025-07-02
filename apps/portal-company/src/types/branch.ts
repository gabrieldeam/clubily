// src/types/branch.ts

export interface BranchBase {
  name: string;
  slug: string;
}

export interface BranchCreate extends BranchBase {}

export interface BranchUpdate extends BranchBase {}

/**
 * Representação completa de uma filial retornada pela API
 */
export interface BranchRead extends BranchBase {
  id: string;          // UUID
  company_id: string;  // UUID da empresa
  created_at: string;  // ISO datetime
}

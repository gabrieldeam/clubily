// src/types/branch.ts

export interface BranchBase {
  name: string;
  slug: string;
}

/** Payload para criação de filial */
export type BranchCreate = BranchBase;

/** Payload para atualização de filial */
export type BranchUpdate = BranchBase;

/**
 * Representação completa de uma filial retornada pela API
 */
export interface BranchRead extends BranchBase {
  id: string;          // UUID
  company_id: string;  // UUID da empresa
  created_at: string;  // ISO datetime
}

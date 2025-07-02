// src/services/branchService.ts
import api from "./api";
import type {
  BranchRead,
  BranchCreate,
  BranchUpdate,
} from "@/types/branch";

/**
 * Lista todas as filiais da empresa logada.
 * GET /branches
 */
export const listBranches = () =>
  api.get<BranchRead[]>("/branches");

/**
 * Cria uma nova filial.
 * POST /branches
 */
export const createBranch = (payload: BranchCreate) =>
  api.post<BranchRead>("/branches", payload);

/**
 * Atualiza uma filial existente.
 * PUT /branches/{branch_id}
 */
export const updateBranch = (
  branchId: string,
  payload: BranchUpdate
) =>
  api.put<BranchRead>(`/branches/${branchId}`, payload);

/**
 * Remove uma filial.
 * DELETE /branches/{branch_id}
 */
export const deleteBranch = (branchId: string) =>
  api.delete<void>(`/branches/${branchId}`);

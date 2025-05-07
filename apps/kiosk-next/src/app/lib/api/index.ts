// apps/portal-next/src/lib/api/index.ts
export { default as api } from './client';

// --- auth.ts exports ---
export * from './auth';

// --- users.ts exports ---
export * from './users';

// --- companies.ts exports ---
export {
  registerCompany,
  verifyEmailCompany,
  loginCompany,
  forgotPasswordCompany,
  resetPasswordCompany,
  listCompanyClients,
} from './companies';
export type {
  CompanyCreate,
  CompanyLogin,
  CompanyRead,
} from './companies';

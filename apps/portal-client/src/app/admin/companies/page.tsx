'use client';

import { useEffect, useState } from 'react';
import {
  searchCompaniesAdmin,
  activateCompany,
  deactivateCompany,
} from '@/services/companyService';
import type { CompanyRead } from '@/types/company';
import styles from './page.module.css';

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<CompanyRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  async function fetchCompanies() {
    setLoading(true);
    try {
      const res = await searchCompaniesAdmin(); // sem filtros
      setCompanies(res.data);
    } finally {
      setLoading(false);
    }
  }

  async function toggleCompany(comp: CompanyRead) {
    setProcessingId(comp.id);
    try {
      if (comp.is_active) {
        await deactivateCompany(comp.id);
      } else {
        await activateCompany(comp.id);
      }
      await fetchCompanies();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) return <p>Carregando empresas...</p>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Empresas</h1>
      </header>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Descrição</th>
            <th>CNPJ</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {companies.map(comp => (
            <tr key={comp.id}>
              <td>{comp.name}</td>
              <td>{comp.description}</td>
              <td>{comp.cnpj}</td>
              <td>
                <button
                  className={styles.button}
                  onClick={() => toggleCompany(comp)}
                  disabled={processingId === comp.id}
                >
                  {comp.is_active ? 'Desativar' : 'Ativar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

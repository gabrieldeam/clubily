'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/Header/Header';
import { getTemplateInstances } from '@/services/loyaltyService';
import type { InstanceRead } from '@/types/loyalty';
import type { Paginated } from '@/types/loyalty';
import styles from './page.module.css';

export default function TemplateInstancesPage() {
  const params = useParams();
  const tplId = Array.isArray(params.tplId) ? params.tplId[0] : params.tplId;
  const rawName = Array.isArray(params.tplName) ? params.tplName[0] : params.tplName;
  const tplName = rawName ? decodeURIComponent(rawName) : '';

  // dados / estados
  const [instData, setInstData] = useState<Paginated<InstanceRead> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // filtros
  const limit = 20;
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<'active' | 'completed' | ''>('');
  const [missing, setMissing] = useState<number | undefined>();
  const [expires, setExpires] = useState<number | undefined>();

  // fetch
  useEffect(() => {
    if (!tplId) return;
    const fetchData = async () => {
      setLoading(true); setError(null);
      try {
        const data = await getTemplateInstances(tplId, {
          page,
          page_size: limit,
          status: status || undefined,
          missing_leq: missing,
          expires_within: expires,
        });
        setInstData(data);
      } catch {
        setError('Erro ao carregar cartões.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tplId, page, status, missing, expires]);

  if (!tplId) return <div className={styles.loading}>Carregando ID…</div>;
  if (loading) return <div className={styles.loading}>Carregando…</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!instData) return null;

  const totalPages = Math.ceil(instData.total / limit);

  return (
    <>
      <Header />
      <div className={styles.container}>
        <main className={styles.main}>
          <h1>{tplName}</h1>

          {/* filtros simples */}
          <div className={styles.filters}>
            <select value={status} onChange={e=>{setStatus(e.target.value as any); setPage(1);}}>
              <option value="">Todos</option>
              <option value="active">Ativos</option>
              <option value="completed">Concluídos</option>
            </select>
            {/* pode trocar para inputs numéricos se quiser */}
            <input
              type="number"
              placeholder="Faltando ≤"
              value={missing ?? ''}
              onChange={e=>{setMissing(e.target.value ? Number(e.target.value) : undefined); setPage(1);}}
            />
            <input
              type="number"
              placeholder="Expira em ≤ dias"
              value={expires ?? ''}
              onChange={e=>{setExpires(e.target.value ? Number(e.target.value) : undefined); setPage(1);}}
            />
          </div>

          {/* tabela */}
          <div className={styles.tableWrapper}>
            <div className={styles.tableHeader}>
              <div>ID Usuário</div>
              <div>Carimbos</div>
              <div>Emitido</div>
              <div>Expira</div>
              <div>Status</div>
            </div>
            <div className={styles.tableBody}>
              {instData.data.map(inst => (
                <div key={inst.id} className={styles.tableRow}>
                  <div data-label="Usuário">{inst.user_id}</div>
                  <div data-label="Carimbos">{inst.stamps_given}</div>
                  <div data-label="Emitido">{new Date(inst.issued_at).toLocaleDateString()}</div>
                  <div data-label="Expira">{inst.expires_at ? new Date(inst.expires_at).toLocaleDateString() : '-'}</div>
                  <div data-label="Status">{inst.completed_at ? 'Concluído' : 'Ativo'}</div>
                </div>
              ))}
            </div>
          </div>

          {/* paginação */}
          <div className={styles.pagination}>
            <button disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Anterior</button>
            <span>Página {page} de {totalPages||1}</span>
            <button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Próxima</button>
          </div>
        </main>
      </div>
    </>
  );
}

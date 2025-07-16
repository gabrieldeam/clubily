// src/app/(your-route)/TemplateInstancesPage.tsx
'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/Header/Header';
import { getTemplateInstances } from '@/services/loyaltyService';
import type { InstanceAdminDetail, Paginated } from '@/types/loyalty';
import styles from './page.module.css';

export default function TemplateInstancesPage() {
  const params = useParams();
  const tplId = Array.isArray(params.tplId) ? params.tplId[0] : params.tplId;
  const rawName = Array.isArray(params.tplName) ? params.tplName[0] : params.tplName;
  const tplName = rawName ? decodeURIComponent(rawName) : '';

  // estados
  const [instData, setInstData] = useState<Paginated<InstanceAdminDetail> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // filtros
  const limit = 20;
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<'active' | 'completed' | ''>('');
  const [missing, setMissing] = useState<number | undefined>();
  const [expires, setExpires] = useState<number | undefined>();

  useEffect(() => {
    if (!tplId) return;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
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

          {/* filtros */}
          <div className={styles.filters}>
            <select
              value={status}
              onChange={e => { setStatus(e.target.value as any); setPage(1); }}
            >
              <option value="">Todos</option>
              <option value="active">Ativos</option>
              <option value="completed">Concluídos</option>
            </select>
            <input
              type="number"
              placeholder="Faltando ≤"
              value={missing ?? ''}
              onChange={e => {
                setMissing(e.target.value ? Number(e.target.value) : undefined);
                setPage(1);
              }}
            />
            <input
              type="number"
              placeholder="Expira em ≤ dias"
              value={expires ?? ''}
              onChange={e => {
                setExpires(e.target.value ? Number(e.target.value) : undefined);
                setPage(1);
              }}
            />
          </div>

          {/* tabela */}
          <div className={styles.tableWrapper}>
            <div className={styles.tableHeader}>
              <div>Nome</div>
              <div>E‑mail</div>
              <div>Carimbos/Total</div>
              <div>Resgatadas/Total</div>
              <div>Pendentes</div>
              <div>Emitido</div>
              <div>Expira</div>
              <div>Status</div>
            </div>
            <div className={styles.tableBody}>
              {instData.data.map(inst => (
                <div key={inst.id} className={styles.tableRow}>
                  <div data-label="Nome">{inst.user_name}</div>
                  <div data-label="E‑mail">{inst.user_email}</div>
                  <div data-label="Carimbos/Total">{inst.stamps_given}/{inst.stamp_total}</div>
                  <div data-label="Total Recompensas">{inst.redeemed_count}/{inst.total_rewards}</div>
                  <div data-label="Pendentes">{inst.pending_count}</div>
                  <div data-label="Emitido">
                    {new Date(inst.issued_at).toLocaleDateString()}
                  </div>
                  <div data-label="Expira">
                    {inst.expires_at ? new Date(inst.expires_at).toLocaleDateString() : '-'}
                  </div>
                  <div data-label="Status">
                    {inst.completed_at ? 'Concluído' : 'Ativo'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* paginação */}
          <div className={styles.pagination}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              Anterior
            </button>
            <span>
              Página {page} de {totalPages || 1}
            </span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Próxima
            </button>
          </div>
        </main>
      </div>
    </>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header/Header';
import Modal from '@/components/Modal/Modal';
import {
  getCashbackProgram,
  getProgramUsage,
} from '@/services/cashbackProgramService';
import type {
  CashbackProgramRead,
  PaginatedProgramUsage,
} from '@/types/cashbackProgram';
import styles from './page.module.css';

type ViewMode = 'list' | 'card';

export default function ProgramDetailPage() {
  const params = useParams();

  // aceita tanto camelCase quanto snake_case
  const programIdRaw =
    (Array.isArray((params as any).programId)
      ? (params as any).programId[0]
      : (params as any).programId) ??
    (Array.isArray((params as any).program_id)
      ? (params as any).program_id[0]
      : (params as any).program_id);

  const programId: string | undefined = programIdRaw;

  const [program, setProgram] = useState<CashbackProgramRead | null>(null);
  const [usage, setUsage] = useState<PaginatedProgramUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // paginação
  const [page, setPage] = useState(0);
  const limit = 10;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) setViewMode('card');
  }, [isMobile]);

  useEffect(() => {
    if (!programId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // busca detalhes do programa
        const prog = await getCashbackProgram(programId);
        const progData = 'data' in prog ? prog.data : prog;
        setProgram(progData);

        // busca uso com paginação
        const useResp = await getProgramUsage(
          programId,
          page * limit,
          limit
        );
        const useData = 'data' in useResp ? useResp.data : useResp;
        setUsage(useData);
      } catch (err) {
        setError('Erro ao carregar dados do programa');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [programId, page]);

  if (!programId) {
    return <div className={styles.loading}>Carregando ID...</div>;
  }

  if (loading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!program || !usage) {
    return <div className={styles.error}>Programa não encontrado.</div>;
  }

  // calcula total de páginas com base em total_associations
  const totalPages = Math.ceil(usage.total_associations / limit);

  return (
    <>
    <Header />
    <div className={styles.container}>
      <main className={styles.main}>
        <section className={styles.header}>
          <h1>{program.name}</h1>
          <div className={styles.metrics}>
            <div>
              <span>Total Cashback</span>
              <strong>R$ {usage.total_cashback_value.toFixed(2)}</strong>
            </div>
            <div>
              <span>Uso</span>
              <strong>{usage.usage_count}</strong>
            </div>
            <div>
              <span>Média Gasto</span>
              <strong>R$ {usage.average_amount_spent.toFixed(2)}</strong>
            </div>
            <div>
              <span>Usuários Únicos</span>
              <strong>{usage.unique_user_count.toFixed(2)}</strong>
            </div>
            <div>
              <span>Média Uso por Usuário</span>
              <strong>{usage.average_uses_per_user.toFixed(2)}</strong>
            </div>
            <div>
              <span>Médias em Dias de Intervalo</span>
              <strong>{usage.average_interval_days.toFixed(2)}</strong>
            </div>
          </div>
          <div className={styles.props}>
            <div><strong>Percentual</strong> {program.percent}%</div>
            <div>
              <strong>Validade</strong> {program.validity_days} dia{program.validity_days > 1 ? 's' : ''}
            </div>
            <div><strong>Status</strong> {program.is_active ? 'Ativo' : 'Inativo'}</div>
            <div><strong>Visível</strong> {program.is_visible ? 'Sim' : 'Não'}</div>
          </div>
        </section>

        <section className={styles.usage}>
          {/* cabeçalho com título e botão */}
          <div className={styles.usageHeader}>
            <h4>Associações Recentes</h4>
            {!isMobile && (
              <button
                className={styles.viewToggleBtn}
                onClick={() => setViewModalOpen(true)}
              >
                ⋮
              </button>
            )}
          </div>

          {viewMode === 'list' ? (
            <div className={styles.tableWrapper}>
              <div className={styles.tableHeader}>
                <div className={styles.colCliente}>Cliente</div>
                <div className={styles.colGasto}>Gasto (R$)</div>
                <div className={styles.colCashback}>Cashback (R$)</div>
                <div className={styles.colDate}>Data</div>
                <div className={styles.colExpire}>Expira</div>
              </div>
              <div className={styles.tableBody}>
                {usage.associations.map((a) => (
                  <div key={a.id} className={styles.tableRow}>
                    <div className={styles.colCliente} data-label="Cliente:">{a.user_name}</div>
                    <div className={styles.colGasto} data-label="Gasto (R$):">{a.amount_spent.toFixed(2)}</div>
                    <div className={styles.colCashback} data-label="Cashback (R$):">{a.cashback_value.toFixed(2)}</div>
                    <div className={styles.colDate} data-label="Data:">{new Date(a.assigned_at).toLocaleDateString()}</div>
                    <div className={styles.colExpire} data-label="Expira:">{new Date(a.expires_at).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.cardGrid}>
              {usage.associations.map((a) => (
                <div key={a.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h5>{a.user_name}</h5>
                    <span>R$ {a.cashback_value.toFixed(2)}</span>
                  </div>
                  <div className={styles.cardBody}>
                    <p><span>Gasto:</span> R$ {a.amount_spent.toFixed(2)}</p>
                    <p><span>Data:</span> {new Date(a.assigned_at).toLocaleDateString()}</p>
                    <p><span>Expira:</span> {new Date(a.expires_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

                      {/* paginação */}
            <div className={styles.pagination}>
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 0))}
                disabled={page === 0}
              >
                Anterior
              </button>
              <span>
                Página {page + 1} de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
                disabled={page + 1 >= totalPages}
              >
                Próxima
              </button>
            </div>
        </section>

        {/* modal de seleção de view */}
        <Modal open={viewModalOpen} onClose={() => setViewModalOpen(false)}>
          <div className={styles.viewModeModal}>
            <h2>Modo de visualização</h2>
            <div className={styles.viewOptions}>
              <button
                onClick={() => {
                  setViewMode('list');
                  setViewModalOpen(false);
                }}
              >
                📄 Lista
              </button>
              <button
                onClick={() => {
                  setViewMode('card');
                  setViewModalOpen(false);
                }}
              >
                🧾 Card
              </button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
    </>    
  );
}

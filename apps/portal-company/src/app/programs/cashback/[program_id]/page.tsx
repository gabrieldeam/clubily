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

export default function ProgramDetailPage() {
  const params = useParams();
  console.log('useParams():', params);

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
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [viewModalOpen, setViewModalOpen] = useState(false);

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
    // Se ainda não temos programId, aguardamos o próximo render sem levantar erro
    if (!programId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const prog = await getCashbackProgram(programId);
        const progData = 'data' in prog ? prog.data : prog;
        setProgram(progData);
        const use = await getProgramUsage(programId, 0, 20);
        const useData = 'data' in use ? use.data : use;
        setUsage(useData);
      } catch (err) {
        setError('Erro ao carregar dados do programa');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [programId]);

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

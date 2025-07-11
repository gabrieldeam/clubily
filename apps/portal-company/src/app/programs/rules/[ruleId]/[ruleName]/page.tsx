// src/app/rules/[ruleId]/[ruleName]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/Header/Header';
import CalendarRange from '@/components/CalendarRange/CalendarRange';
import Modal from '@/components/Modal/Modal';
import { getSingleRuleMetric, getRuleTransactions } from '@/services/pointsMetricsService';
import type { RuleMetricRead, RuleTransactionRead, PaginatedRuleTransactions } from '@/types/pointsMetrics';
import styles from './page.module.css';

type ViewMode = 'list' | 'card';


export default function RuleDetailPage() {
  const params = useParams();
  const ruleId = Array.isArray(params.ruleId) ? params.ruleId[0] : params.ruleId;
  const rawName = Array.isArray(params.ruleName) ? params.ruleName[0] : params.ruleName;
  const ruleName = rawName ? decodeURIComponent(rawName) : '';

  const [metric, setMetric] = useState<RuleMetricRead | null>(null);
  const [txData, setTxData] = useState<PaginatedRuleTransactions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // date range
  const today = new Date();
  const [startDate, setStartDate] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [endDate, setEndDate] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth() + 1, 0)
  );
  const [dateModalOpen, setDateModalOpen] = useState(false);

  // pagination
  const [page, setPage] = useState(0);
  const limit = 10;

  // mobile detection & default card
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  useEffect(() => { if (isMobile) setViewMode('card'); }, [isMobile]);

  // fetch metric and transactions
  useEffect(() => {
    if (!ruleId) return;
    const fetchAll = async () => {
      setLoading(true); setError(null);
      try {
        // metric
        const sd = startDate.toISOString().slice(0,10);
        const ed = endDate.toISOString().slice(0,10);
        const m = await getSingleRuleMetric(ruleId, sd, ed);
        setMetric(m.data);
        // transactions
        const t = await getRuleTransactions(ruleId, page * limit, limit);
        setTxData(t.data);
      } catch {
        setError('Erro ao carregar dados da regra.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [ruleId, startDate, endDate, page]);

  if (!ruleId) return <div className={styles.loading}>Carregando ID...</div>;
  if (loading) return <div className={styles.loading}>Carregando...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!metric || !txData) return <div className={styles.error}>Não encontrado.</div>;

  const totalPages = Math.ceil(txData.total / limit);

  return (
    <>
      <Header />
      <div className={styles.container}>
        <main className={styles.main}>
          <section className={styles.header}>
            <h1>{ruleName}</h1>
            <button className={styles.rangeBtn} onClick={()=>setDateModalOpen(true)}>
              {startDate.toLocaleDateString()} – {endDate.toLocaleDateString()}
            </button>
          </section>
          <section className={styles.metrics}>
            <div><span>Total Premiado</span><strong>{metric.total_awarded}</strong></div>
            <div><span>Transações</span><strong>{metric.transaction_count}</strong></div>
            <div><span>Usuários Únicos</span><strong>{metric.unique_users}</strong></div>
            <div><span>Média por Transação</span><strong>{metric.average_per_tx.toFixed(2)}</strong></div>
          </section>

          <section className={styles.usage}>
            <div className={styles.usageHeader}>
              <h4>Transações</h4>
              {!isMobile && <button className={styles.viewToggleBtn} onClick={()=>setViewModalOpen(true)}>⋮</button>}
            </div>

            {viewMode==='list' ? (
              <div className={styles.tableWrapper}>
                <div className={styles.tableHeader}>
                  <div className={styles.colUser}>Usuário</div>
                  <div className={styles.colAmt}>Quantidade</div>
                  <div className={styles.colDesc}>Descrição</div>
                  <div className={styles.colDate}>Data</div>
                </div>
                <div className={styles.tableBody}>
                  {txData.items.map((tx: RuleTransactionRead)=> (
                    <div key={tx.id} className={styles.tableRow}>
                      <div className={styles.colUser} data-label="Usuário:">{tx.user_name}</div>
                      <div className={styles.colAmt} data-label="Quantidade:">{tx.amount}</div>
                      <div className={styles.colDesc} data-label="Descrição:">{tx.description||'-'}</div>
                      <div className={styles.colDate} data-label="Data:">{new Date(tx.created_at).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.cardGrid}>
                {txData.items.map(tx=>(
                  <div key={tx.id} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <h5>{tx.user_id}</h5>
                      <span>{tx.amount}</span>
                    </div>
                    <div className={styles.cardBody}>
                      <p><span>Descrição:</span> {tx.description||'-'}</p>
                      <p><span>Data:</span> {new Date(tx.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.pagination}>
              <button onClick={()=>setPage(p=>Math.max(p-1,0))} disabled={page===0}>Anterior</button>
              <span>Página {page+1} de {totalPages}</span>
              <button onClick={()=>setPage(p=>Math.min(p+1,totalPages-1))} disabled={page+1>=totalPages}>Próxima</button>
            </div>
          </section>

          <Modal open={viewModalOpen} onClose={()=>setViewModalOpen(false)}>
            <div className={styles.viewModeModal}>
              <h2>Modo de visualização</h2>
              <div className={styles.viewOptions}>
                <button onClick={()=>{setViewMode('list'); setViewModalOpen(false)}}>📄 Lista</button>
                <button onClick={()=>{setViewMode('card'); setViewModalOpen(false)}}>🧾 Card</button>
              </div>
            </div>
          </Modal>

          <Modal open={dateModalOpen} onClose={()=>setDateModalOpen(false)} width={520}>
            <div className={styles.calendarDropdown}>
              <CalendarRange selectedStartDate={startDate} selectedEndDate={endDate} onRangeChange={(s,e)=>{setStartDate(s); if(e) setEndDate(e); if(e) setDateModalOpen(false);}} />
              <div className={styles.presetsWrapper}>
                {/* same presets buttons */}
              </div>
            </div>
          </Modal>
        </main>
      </div>
    </>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import OverlappingCards from '@/components/OverlappingCards/OverlappingCards';
import CompanyCard from '@/components/CompanyCard/CompanyCard';
import Header from '@/components/Header/Header';
import Modal from '@/components/Modal/Modal';
import { listMyCards, listTemplates } from '@/services/loyaltyService';
import { InstanceDetail, TemplateRead } from '@/types/loyalty';
import styles from './page.module.css';

export default function WalletPage() {
  const router = useRouter();

  const [cards, setCards] = useState<InstanceDetail[]>([]);
  const [templates, setTemplates] = useState<TemplateRead[]>([]);
  const [tplPage, setTplPage] = useState(1);
  const [tplHasMore, setTplHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingTpl, setLoadingTpl] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const companyId = 'eed72759-89ec-428c-ab59-37c657d74cad';

  useEffect(() => {
    const load = async () => {
      try {
        const { data: userCards } = await listMyCards();
        setCards(userCards);
        if (userCards.length === 0) {
          await fetchMoreTemplates(1);
        }
      } catch {
        setError('Falha ao carregar dados');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMoreTemplates = async (page: number) => {
    setLoadingTpl(true);
    try {
      const { data } = await listTemplates(companyId, page);
      setTemplates(prev => [...prev, ...data]);
      setTplPage(page);
      setTplHasMore(data.length === 20);
    } catch {
      setError('Erro ao carregar templates');
    } finally {
      setLoadingTpl(false);
    }
  };

  const handleLoadMore = () => fetchMoreTemplates(tplPage + 1);

  const handleOpenModal = () => {
    setModalOpen(true);
    if (templates.length === 0) {
      fetchMoreTemplates(1);
    }
  };

  if (loading) return <div className={styles.loading}>Carregando...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  const completedNotClaimed = cards.filter(
    c => c.completed_at && !c.reward_claimed
  ).length;

  return (
    <>
      <Header onSearch={q => router.push(`/search?name=${encodeURIComponent(q)}`)} />

      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.stats}>
            <span>{cards.length} cartões</span>
            <span>|</span>
            <span>{completedNotClaimed} presentes disponíveis</span>
          </div>
        </header>

        
        
        <div className={styles.cardsContainer}>
          {cards.length > 0 ? (
            <>
            <OverlappingCards cards={cards} />
              {/* Novo cartão de exploração */}
              <div className={styles.exploreCard}>
                <div className={styles.exploreContent}>
                  <div className={styles.exploreIcon}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                  </div>
                  
                  <div className={styles.exploreText}>
                    <h2 className={styles.exploreTitle}>Descubra Novas Recompensas</h2>
                    <p className={styles.exploreDesc}>
                      Explore cartões exclusivos e aumente suas chances de ganhar prêmios incríveis!
                    </p>
                  </div>
                  
                  <button className={styles.exploreBtn} onClick={handleOpenModal}>
                    Explorar Agora
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14"></path>
                      <path d="m12 5 7 7-7 7"></path>
                    </svg>
                  </button>
                </div>
                
                <div className={styles.floatingShapes}>
                  <div className={styles.shapeCircle}></div>
                  <div className={styles.shapeTriangle}></div>
                  <div className={styles.shapeSquare}></div>
                </div>
              </div>
            </>
          ) : (
            <>
              {templates.map(tpl => (
                <CompanyCard key={tpl.id} template={tpl} />
              ))}
              {tplHasMore && (
                <button
                  className={styles.loadMoreTpl}
                  disabled={loadingTpl}
                  onClick={handleLoadMore}
                >
                  {loadingTpl ? 'Carregando...' : 'Carregar mais'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <div className={styles.modalContent}>
          {templates.map(tpl => (
            <CompanyCard key={tpl.id} template={tpl} />
          ))}
          {tplHasMore && (
            <button
              className={styles.loadMoreTpl}
              disabled={loadingTpl}
              onClick={handleLoadMore}
            >
              {loadingTpl ? 'Carregando...' : 'Carregar mais'}
            </button>
          )}
        </div>
      </Modal>
    </>
  );
}
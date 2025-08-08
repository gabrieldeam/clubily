// src/app/wallet/page.tsx (ou src/pages/wallet.tsx, dependendo da sua estrutura)
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import OverlappingCards from '@/components/OverlappingCards/OverlappingCards';
import CompanyCard from '@/components/CompanyCard/CompanyCard';
import Header from '@/components/Header/Header';
import Modal from '@/components/Modal/Modal';
import {
  listMyCards,
  listActiveTemplates,
  listCompaniesWithCards,
  listMyCardsByCompany,
} from '@/services/loyaltyService';
import { useAddress } from '@/context/AddressContext'
import type {
  InstanceDetail,
  TemplateRead
} from '@/types/loyalty';
import type { CompanyBasic } from '@/types/company';
import styles from './page.module.css';

export default function WalletPage() {
  const router = useRouter();
  const baseUrl =
    process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';

  /** Estados de empresas **/
  const [companies, setCompanies] = useState<CompanyBasic[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  /** Estados de cartões **/
  const [cards, setCards] = useState<InstanceDetail[]>([]);
  const [cardPage, setCardPage] = useState(1);
  const [cardHasMore, setCardHasMore] = useState(true);
  const [loadingCards, setLoadingCards] = useState(false);

  /** Estados de templates de exploração (mantive só para o modal) **/
  const [templates, setTemplates] = useState<TemplateRead[]>([]);
  const [tplPage, setTplPage] = useState(1);
  const [tplHasMore, setTplHasMore] = useState(true);
  const [loadingTpl, setLoadingTpl] = useState(false);

  /** Estados gerais **/
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const CARD_PAGE_SIZE = 10;

  const { selectedAddress, radiusKm } = useAddress()

  useEffect(() => {
    fetchCompanies();
    fetchAllCards(1, true);
  }, []);

  const fetchCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const { data } = await listCompaniesWithCards();
      setCompanies(data);
    } catch {
      setCompanyError('Falha ao carregar empresas');
    } finally {
      setLoadingCompanies(false);
    }
  };

  /** Busca todos os cartões (sem filtro de empresa) **/
  const fetchAllCards = async (
    page: number,
    initial = false
  ) => {
    if (initial) setLoading(true);
    else setLoadingCards(true);

    try {
      const { data } = await listMyCards(page, CARD_PAGE_SIZE);
      if (page === 1) setCards(data);
      else setCards((prev) => [...prev, ...data]);

      setCardPage(page);
      setCardHasMore(data.length === CARD_PAGE_SIZE);
      setError(null);
    } catch {
      setError('Falha ao carregar cartões');
    } finally {
      if (initial) setLoading(false);
      else setLoadingCards(false);
    }
  };

  /** Busca cartões de uma empresa específica **/
  const fetchCardsByCompany = async (
    companyId: string,
    page: number,
    initial = false
  ) => {
    if (initial) setLoading(true);
    else setLoadingCards(true);

    try {
      const { data } = await listMyCardsByCompany(
        companyId,
        page,
        CARD_PAGE_SIZE
      );
      if (page === 1) setCards(data);
      else setCards((prev) => [...prev, ...data]);

      setCardPage(page);
      setCardHasMore(data.length === CARD_PAGE_SIZE);
      setError(null);
    } catch {
      setError('Falha ao carregar cartões da empresa');
    } finally {
      if (initial) setLoading(false);
      else setLoadingCards(false);
    }
  };

  const handleLoadMoreCards = () => {
    if (selectedCompany) {
      fetchCardsByCompany(selectedCompany, cardPage + 1);
    } else {
      fetchAllCards(cardPage + 1);
    }
  };

  /** Seleção / desselecão de empresa **/
  const handleCompanyClick = (companyId: string) => {
    if (selectedCompany === companyId) {
      // desseleciona → volta para todos
      setSelectedCompany(null);
      fetchAllCards(1, true);
    } else {
      // seleciona → filtra por empresa
      setSelectedCompany(companyId);
      fetchCardsByCompany(companyId, 1, true);
    }
  };

  /** Paginação de templates (modal) **/
  const fetchMoreTemplates = async (page: number) => {
    setLoadingTpl(true);
    try {
      if (!selectedAddress) {
        throw new Error('Selecione um endereço para explorar templates')
      }
      const { data } = await listActiveTemplates(
        selectedAddress.postal_code,
        radiusKm,
        page,
      )
      setTemplates((prev) => [...prev, ...data]);
      setTplPage(page);
      setTplHasMore(data.length === 20);
    } catch {
      setError('Erro ao carregar templates');
    } finally {
      setLoadingTpl(false);
    }
  };
  const handleLoadMoreTpl = () => fetchMoreTemplates(tplPage + 1);
  const handleOpenModal = () => {
    setModalOpen(true);
    if (templates.length === 0) fetchMoreTemplates(1);
  };

  if (loading) return <div className={styles.loading}>Carregando...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  // cálculo de recompensas disponíveis
  const availableRewards = cards.reduce((sum, card) => {
    const availForCard = card.template.rewards_map.filter((link) => {
      if (card.stamps_given < link.stamp_no) return false;
      const redemption = card.redemptions.find(
        (r) => r.link_id === link.id
      );
      if (redemption?.used) return false;
      return true;
    }).length;
    return sum + availForCard;
  }, 0);

  return (
    <>
      <Header
        onSearch={(q) =>
          router.push(`/search?name=${encodeURIComponent(q)}`)
        }
      />

      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.stats}>
            <span>{cards.length} cartões</span>
            <span>|</span>
            <span>{availableRewards} presentes disponíveis</span>
          </div>
        </header>

        {/* --- NOVO: Lista de empresas --- */}
        {companyError && (
          <div className={styles.error}>{companyError}</div>
        )}
        {!companyError && (
          <div className={styles.companyList}>
            {loadingCompanies
              ? <div>Carregando empresas...</div>
              : companies.map((c) => (
                  <div
                    key={c.id}
                    className={`${styles.companyItem} ${
                      selectedCompany === c.id
                        ? styles.selected
                        : ''
                    }`}
                    onClick={() => handleCompanyClick(c.id)}
                  >
                    <div className={styles.companyLogoWrapper}>
                      <Image
                        src={`${baseUrl}${c.logo_url}`}
                        alt={c.name}
                        fill
                        className={styles.companyLogo}
                      />
                    </div>
                    <span className={styles.companyName}>
                      {c.name}
                    </span>
                  </div>
                ))
            }
          </div>
        )}
        {/* --- fim lista de empresas --- */}

        <div className={styles.cardsContainer}>
          {cards.length > 0 ? (
            <>
              <OverlappingCards cards={cards} />

              {cardHasMore && (
                <button
                  className={styles.loadMoreTpl}
                  disabled={loadingCards}
                  onClick={handleLoadMoreCards}
                >
                  {loadingCards ? 'Carregando...' : 'Carregar mais'}
                </button>
              )}
              
              {/* Explorar templates continua via modal */}
              <div className={styles.exploreCard}>
                <div className={styles.exploreContent}>
                  <div className={styles.exploreIcon}>
                    {/* ícone */}
                  </div>
                  <div className={styles.exploreText}>
                    <h2 className={styles.exploreTitle}>
                      Descubra Novas Recompensas
                    </h2>
                    <p className={styles.exploreDesc}>
                      Explore cartões exclusivos e aumente suas
                      chances de ganhar prêmios incríveis!
                    </p>
                  </div>
                  <button
                    className={styles.exploreBtn}
                    onClick={handleOpenModal}
                  >
                    Explorar Agora
                    {/* ícone */}
                  </button>
                </div>
              </div>
              
            </>
          ) : (
            <>
              {/* Explorar templates continua via modal */}
              <div className={styles.exploreCard}>
                <div className={styles.exploreContent}>
                  <div className={styles.exploreIcon}>
                    {/* ícone */}
                  </div>
                  <div className={styles.exploreText}>
                    <h2 className={styles.exploreTitle}>
                      Descubra Recompensas
                    </h2>
                    <p className={styles.exploreDesc}>
                      Explore cartões exclusivos e aumente suas
                      chances de ganhar prêmios incríveis!
                    </p>
                  </div>
                  <button
                    className={styles.exploreBtn}
                    onClick={handleOpenModal}
                  >
                    Explorar Agora
                    {/* ícone */}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        width="100%"
      >
        <div className={styles.modalContent}>
          {templates.map((tpl) => (
            <CompanyCard
              key={tpl.id}
              template={tpl}
            />
          ))}
          {tplHasMore && (
            <button
              className={styles.loadMoreTpl}
              disabled={loadingTpl}
              onClick={handleLoadMoreTpl}
            >
              {loadingTpl
                ? 'Carregando...'
                : 'Carregar mais'}
            </button>
          )}
        </div>
      </Modal>
    </>
  );
}

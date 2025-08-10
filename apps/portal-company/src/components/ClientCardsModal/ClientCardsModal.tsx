'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/Modal/Modal';
import Notification from '@/components/Notification/Notification';
import OverlappingCards from '@/components/OverlappingCards/OverlappingCards';
import WalletCard from '@/components/WalletCard/WalletCard';

import {
  adminListTemplates,
  adminIssueCardForUser,
  adminGetUserCardsDetailed,
} from '@/services/loyaltyService';

import type { TemplateReadFull, InstanceDetail } from '@/types/loyalty';

type Props = {
  open: boolean;
  onClose: () => void;
  userId: string;
  /** passe só o nome aqui, ex.: "Fulano da Silva" */
  userLabel?: string;
};

export default function ClientCardsModal({
  open,
  onClose,
  userId,
  userLabel,
}: Props) {
  const [templates, setTemplates] = useState<TemplateReadFull[]>([]);
  const [tplLoading, setTplLoading] = useState(false);

  const [userCards, setUserCards] = useState<InstanceDetail[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [cardsError, setCardsError] = useState<string | null>(null);

  const [cardViewOpen, setCardViewOpen] = useState(false);
  const [selectedUserCard, setSelectedUserCard] = useState<InstanceDetail | null>(null);

  useEffect(() => {
    if (!open || !userId) return;

    setCardsError(null);

    setTplLoading(true);
    adminListTemplates()
      .then(r => setTemplates(r.data))
      .catch(() => setCardsError('Erro ao carregar templates.'))
      .finally(() => setTplLoading(false));

    refreshUserCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId]);

  const refreshUserCards = async () => {
    if (!userId) return;
    setCardsLoading(true);
    setCardsError(null);
    try {
      const r = await adminGetUserCardsDetailed(userId);
      setUserCards(r.data);
    } catch {
      setCardsError('Erro ao carregar cartões do usuário.');
    } finally {
      setCardsLoading(false);
    }
  };

  const handleIssueCard = async (templateId: string) => {
    if (!userId) return;
    try {
      await adminIssueCardForUser(templateId, { user_id: userId });
      await refreshUserCards();
    } catch (e: any) {
      setCardsError(e?.response?.data?.detail ?? 'Falha ao emitir cartão.');
    }
  };

  const handleOpenCard = (card: InstanceDetail) => {
    setSelectedUserCard(card);
    setCardViewOpen(true);
  };

  const handleClose = () => {
    setCardViewOpen(false);
    setSelectedUserCard(null);
    onClose();
  };

  const hasActiveCards = userCards.length > 0;

  return (
    <>
      <Modal open={open} onClose={handleClose} width={600}>
        <div style={{ padding: 20, backgroundColor: 'white', borderRadius: 20 }}>
          <h2 style={{ margin: 0, marginBottom: 8 }}>Cartões do cliente</h2>
          {hasActiveCards && (
            <h3 style={{ marginTop: 8, marginBottom: 12, fontSize: 16, fontWeight: 600 }}>
              Cartões ativos
            </h3>
          )}

          {cardsLoading ? (
            <p>Carregando cartões…</p>
          ) : cardsError ? (
            <Notification
              type="error"
              message={cardsError}
              onClose={() => setCardsError(null)}
            />
          ) : (
            <OverlappingCards
              cards={userCards}
              allTemplates={templates}
              loadingTemplates={tplLoading}
              onIssue={handleIssueCard}
              onOpen={handleOpenCard}
              /** passa o nome para o SimpleCard */
              ownerName={userLabel}
            />
          )}
        </div>
      </Modal>

      <Modal open={cardViewOpen} onClose={() => setCardViewOpen(false)} width={820}>
        {selectedUserCard && <WalletCard card={selectedUserCard} />}
      </Modal>
    </>
  );
}

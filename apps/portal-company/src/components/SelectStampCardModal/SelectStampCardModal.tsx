// apps/portal-company/src/components/SelectStampCardModal/SelectStampCardModal.tsx
'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/Modal/Modal';
import AppNotification from '@/components/Notification/Notification'; // alias p/ evitar conflito com DOM Notification
import SimpleCard from '@/components/SimpleCard/SimpleCard';
import { adminGetUserCardsDetailed } from '@/services/loyaltyService';
import type { InstanceDetail } from '@/types/loyalty';
import { isAxiosError } from 'axios';

type SelectStampCardModalProps = {
  /** Abre/fecha a modal */
  open: boolean;
  /** Fechar a modal (cancelar) */
  onClose: () => void;
  /** Usuário (cliente) cujo(s) cartão(ões) vamos listar */
  userId: string;
  /** Nome do usuário, para exibir no topo e dentro do card */
  userLabel?: string;
  /**
   * Dispara quando o operador confirma a seleção de um cartão.
   * Envia o objeto completo do cartão selecionado.
   */
  onSelect: (card: InstanceDetail) => void;
};

export default function SelectStampCardModal({
  open,
  onClose,
  userId,
  userLabel,
  onSelect,
}: SelectStampCardModalProps) {
  const [cards, setCards] = useState<InstanceDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // carrega os cartões quando a modal abrir
  useEffect(() => {
    if (!open || !userId) return;

    const fetchCards = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminGetUserCardsDetailed(userId);
        const data: InstanceDetail[] = res?.data ?? [];
        setCards(data);
        // se houver somente um, já pré-seleciona
        setSelectedId(data.length === 1 ? data[0].id : null);
      } catch (err: unknown) {
        if (isAxiosError(err)) {
          const data = err.response?.data as { detail?: string } | string | undefined;
          const detail = typeof data === 'string' ? data : data?.detail;
          setError(detail ?? err.message ?? 'Erro ao carregar cartões do cliente.');
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Erro ao carregar cartões do cliente.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, [open, userId]);

  // limpa seleção/erros ao fechar
  useEffect(() => {
    if (!open) {
      setSelectedId(null);
      setError(null);
    }
  }, [open]);

  const selectedCard = selectedId ? cards.find(c => c.id === selectedId) ?? null : null;

  return (
    <Modal open={open} onClose={onClose} width={820}>
      <div
        style={{
          padding: 20,
          background: '#fff',
          borderRadius: 20,
          maxHeight: '80vh',
          overflow: 'auto',
        }}
      >
        <h2 style={{ margin: 0, marginBottom: 4 }}>Selecionar cartão para carimbar</h2>
        {userLabel && (
          <p style={{ margin: 0, marginBottom: 16, color: '#6b7280' }}>
            Cliente: <strong>{userLabel}</strong>
          </p>
        )}

        {error && (
          <div style={{ marginBottom: 12 }}>
            <AppNotification
              type="error"
              message={error}
              onClose={() => setError(null)}
            />
          </div>
        )}

        {loading ? (
          <p>Carregando cartões…</p>
        ) : cards.length === 0 ? (
          <p style={{ color: '#6b7280' }}>Nenhum cartão ativo encontrado para este cliente.</p>
        ) : (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 12,
              }}
            >
              {cards.map((card) => {
                const isSelected = selectedId === card.id;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setSelectedId(card.id)}
                    style={{
                      all: 'unset',
                      cursor: 'pointer',
                      display: 'block',
                      borderRadius: 16,
                      border: `2px solid ${isSelected ? '#FFA600' : 'transparent'}`,
                      background: isSelected ? 'rgba(79,70,229,0.06)' : 'transparent',
                      transition: 'border-color 120ms ease, background 120ms ease',
                    }}
                    title={isSelected ? 'Selecionado' : 'Selecionar este cartão'}
                    aria-pressed={isSelected}
                  >
                    {/* SimpleCard no modo instância (sem abrir modal interna) */}
                    <SimpleCard card={card} disableModal />
                  </button>
                );
              })}
            </div>

            <div
              style={{
                marginTop: 16,
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
              }}
            >
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: '1px solid #e5e7eb',
                  background: '#fff',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => {
                  if (selectedCard) {
                    onSelect(selectedCard);
                    onClose();
                  }
                }}
                disabled={!selectedCard}
                style={{
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: 'none',
                  background: selectedCard ? '#FFA600' : '#9ca3af',
                  color: '#fff',
                  cursor: selectedCard ? 'pointer' : 'not-allowed',
                  fontWeight: 600,
                }}
                title={
                  selectedCard
                    ? 'Confirmar seleção'
                    : 'Selecione um cartão para confirmar'
                }
              >
                Confirmar seleção
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

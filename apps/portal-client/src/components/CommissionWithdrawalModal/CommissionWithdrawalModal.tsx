// src/components/CommissionWithdrawalModal/CommissionWithdrawalModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal/Modal';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import Button from '@/components/Button/Button';
import Notification from '@/components/Notification/Notification';
import {
  getCommissionBalance,
  requestCommissionWithdrawal,
} from '@/services/commissionService';
import type {
  CommissionBalance,
  CommissionWithdrawalCreate,
} from '@/types/commission';
import {
  listTransferMethods,
  createTransferMethod,
  deleteTransferMethod,
} from '@/services/transferMethodService';
import { pixKeyTypeLabels } from '@/utils/pixKeyTypeLabels';
import { PixKeyType } from '@/types/transferMethod';
import type { TransferMethodRead } from '@/types/transferMethod';
import styles from './CommissionWithdrawalModal.module.css';

/* ───────────── helpers ───────────── */
const extractApiError = (err: unknown): string => {
  if (
    typeof err === 'object' &&
    err !== null &&
    'response' in err &&
    typeof (err as Record<string, unknown>).response === 'object'
  ) {
    const res = (err as { response: { data?: { detail?: string } } }).response;
    if (typeof res.data?.detail === 'string') {
      return res.data.detail;
    }
  }
  return 'Ocorreu um erro inesperado.';
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CommissionWithdrawalModal({
  open,
  onClose,
  onSuccess,
}: Props) {
  /* ───────────── state ───────────── */
  const [balance, setBalance] = useState<CommissionBalance | null>(null);

  const [methods, setMethods] = useState<TransferMethodRead[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(false);

  const [loadingBalance, setLoadingBalance] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isCreating, setIsCreating] = useState(false);

  // novo método
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<PixKeyType>(PixKeyType.PHONE);
  const [newValue, setNewValue] = useState('');

  // saque
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  /* ───────────── effects ───────────── */
  useEffect(() => {
    if (!open) return;

    setError(null);

    // saldo
    setLoadingBalance(true);
    getCommissionBalance()
      .then(r => setBalance(r.data))
      .catch(() => setError('Falha ao carregar saldo'))
      .finally(() => setLoadingBalance(false));

    // métodos
    setLoadingMethods(true);
    listTransferMethods()
      .then(r => setMethods(r.data))
      .catch(() => setError('Falha ao carregar métodos'))
      .finally(() => setLoadingMethods(false));
  }, [open]);

  /* ───────────── helpers ───────────── */
  const resetNewForm = () => {
    setNewName('');
    setNewValue('');
    setNewType(PixKeyType.PHONE);
  };

  const handleCreate = async () => {
    setError(null);
    try {
      await createTransferMethod({
        name: newName,
        key_type: newType,
        key_value: newValue,
      });
      const r = await listTransferMethods();
      setMethods(r.data);
      resetNewForm();
      setIsCreating(false);
    } catch (err) {
      setError(extractApiError(err));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTransferMethod(id);
      setMethods(ms => ms.filter(m => m.id !== id));
      if (selectedMethod === id) setSelectedMethod('');
    } catch {
      setError('Erro ao remover método');
    }
  };

  const handleWithdraw = async () => {
    setError(null);
    setWithdrawing(true);
    try {
      const payload: CommissionWithdrawalCreate = {
        amount: parseFloat(amount),
        transfer_method_id: selectedMethod,
      };
      await requestCommissionWithdrawal(payload);
      onSuccess();
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setWithdrawing(false);
    }
  };

  /* ───────────── derived ───────────── */
  const maxAmount = balance?.balance ?? 0;
  const amt = parseFloat(amount) || 0;
  const validAmount = amt > 0 && amt <= maxAmount;

  /* ───────────── render ───────────── */
  return (
    <Modal open={open} onClose={onClose} width={480}>
      <div className={styles.content}>
        <h2 className={styles.title}>Solicitar Saque</h2>

        {error && (
          <Notification
            type="error"
            message={error}
            onClose={() => setError(null)}
          />
        )}

        {/* ------------- SEM MÉTODOS OU CRIAÇÃO ------------- */}
        {methods.length === 0 || isCreating ? (
          !isCreating ? (
            <div className={styles.bannerCreate}>
              <p>
                Você ainda não cadastrou nenhuma chave PIX para recebimento das
                suas comissões.
              </p>
              <Button onClick={() => setIsCreating(true)}>
                Cadastrar Chave
              </Button>
            </div>
          ) : (
            <div className={styles.createForm}>
              <FloatingLabelInput
                id="newName"
                label="Nome (Ex: PIX João)"
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />

              <label htmlFor="newType" className={styles.label}>
                Tipo de chave
              </label>
              <select
                id="newType"
                value={newType}
                onChange={e => setNewType(e.target.value as PixKeyType)}
                className={styles.select}
              >
                {Object.values(PixKeyType).map(type => (
                  <option key={type} value={type}>
                    {pixKeyTypeLabels[type]}
                  </option>
                ))}
              </select>

              <FloatingLabelInput
                id="newValue"
                label="Chave PIX"
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
              />

              <div className={styles.actions}>
                <Button
                  onClick={handleCreate}
                  disabled={!newName || !newValue}
                >
                  Salvar
                </Button>
                <Button
                  style={{ backgroundColor: '#ccc', color: '#333' }}
                  onClick={() => {
                    resetNewForm();
                    setIsCreating(false);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )
        ) : (
          /* ------------- LISTAGEM / SAQUE ------------- */
          <>
            {/* Saldo */}
            <div className={styles.balance}>
              <span>Saldo disponível</span>
              {loadingBalance ? (
                <em>…</em>
              ) : (
                <strong>
                  {maxAmount.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </strong>
              )}
            </div>

            {/* Métodos */}
            <div className={styles.subtitleRow}>
              <h3 className={styles.subtitle}>Chaves PIX</h3>
              <button
                className={styles.button}
                onClick={() => setIsCreating(true)}
              >
                +
              </button>
            </div>

            <div className={styles.methodGrid}>
              {loadingMethods ? (
                <p>Carregando métodos…</p>
              ) : (
                methods.map(m => (
                  <div
                    key={m.id}
                    className={`${styles.methodCard} ${
                      selectedMethod === m.id ? styles.selectedCard : ''
                    }`}
                    onClick={() => setSelectedMethod(m.id)}
                  >
                    <div>
                      <strong>{m.name}</strong>
                      <small>
                        {pixKeyTypeLabels[m.key_type]}: {m.key_value}
                      </small>
                    </div>
                    <button
                      className={styles.deleteBtn}
                      onClick={e => {
                        e.stopPropagation();
                        handleDelete(m.id);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Saque */}
            {selectedMethod ? (
              <div className={styles.withdrawSection}>
                <h3 className={styles.subtitle}>Valor de Saque</h3>
                <FloatingLabelInput
                  id="amount"
                  label="Valor (ex: 150.00)"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
                {!validAmount && amount && (
                  <Notification
                    type="error"
                    message={`Informe valor entre 0,01 e ${maxAmount.toLocaleString(
                      'pt-BR',
                      { style: 'currency', currency: 'BRL' },
                    )}`}
                  />
                )}
                <Button
                  onClick={handleWithdraw}
                  disabled={!validAmount || withdrawing}
                >
                  {withdrawing ? 'Enviando…' : 'Confirmar Saque'}
                </Button>
              </div>
            ) : (
              <p className={styles.hint}>
                Selecione uma chave PIX para poder solicitar o saque
              </p>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

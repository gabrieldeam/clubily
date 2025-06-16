// src/app/credits/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header/Header';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import Button from '@/components/Button/Button';
import Notification from '@/components/Notification/Notification';
import {
  makeAsaasCustomer,
  buyCredits,
  getCharge,
} from '@/services/companyPaymentService';
import {
  getCurrentCompany
} from '@/services/companyService';
import type {
  AsaasCustomerCreate,
  CompanyAsaasCustomerRead,
  CompanyPaymentRead,
} from '@/types/companyPayment';
import type {
  CompanyRead,
} from '@/types/company';

import styles from './page.module.css';

export default function CreditsPage() {
  // --- dados da empresa logada ---
  const [company, setCompany] = useState<CompanyRead | null>(null);
  const [companyLoading, setCompanyLoading] = useState(true);

  // --- estado do customer Asaas ---
  const [customerInfo, setCustomerInfo] = useState<AsaasCustomerCreate>({
    name: '',
    email: '',
    cpfCnpj: '',
    phone: '',
  });
  const [custError, setCustError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CompanyAsaasCustomerRead | null>(null);
  const [custLoading, setCustLoading] = useState(false);

  // --- estado da cobrança PIX ---
  const [amount, setAmount] = useState('');
  const [payError, setPayError] = useState<string | null>(null);
  const [payment, setPayment] = useState<CompanyPaymentRead | null>(null);
  const [status, setStatus] = useState<CompanyPaymentRead['status'] | null>(null);
  const [countdown, setCountdown] = useState(0);
  const intervalRef = useRef<number | null>(null);

  // Carrega dados da empresa e pré-preeche customerInfo
  useEffect(() => {
    getCurrentCompany()
      .then(res => {
        setCompany(res.data);
        setCustomerInfo({
          name: res.data.name,
          email: res.data.email,
          cpfCnpj: res.data.cnpj,
          phone: res.data.phone || '',
        });
      })
      .catch(() => {
        // opcional: notificar falha ao buscar empresa
      })
      .finally(() => setCompanyLoading(false));
  }, []);

  // 1) Cria customer Asaas
  const handleCreateCustomer = async () => {
    setCustError(null);
    const { name, email, cpfCnpj } = customerInfo;
    if (!name || !email || !cpfCnpj) {
      setCustError('Nome, e-mail e CPF/CNPJ são obrigatórios.');
      return;
    }
    setCustLoading(true);
    try {
      const res = await makeAsaasCustomer(customerInfo);
      setCustomer(res.data);
    } catch (err: any) {
      setCustError(err.response?.data?.detail || 'Erro ao criar PIX customer.');
    } finally {
      setCustLoading(false);
    }
  };

  // 2) Gera cobrança PIX
  const handleBuy = async () => {
    setPayError(null);
    const val = parseFloat(amount.replace(',', '.'));
    if (isNaN(val) || val < 25) {
      setPayError('Informe valor numérico ≥ R$ 25,00.');
      return;
    }
    try {
      const res = await buyCredits({ amount: val });
      setPayment(res.data);
      setStatus(res.data.status);
      setCountdown(30);
    } catch (err: any) {
      setPayError(err.response?.data?.detail || 'Erro ao gerar cobrança.');
    }
  };

  // 3) Polling de status a cada 30s, com contador de 1s
  useEffect(() => {
    if (!payment || ['PAID','FAILED','CANCELLED'].includes(status!)) {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    if (intervalRef.current === null) {
      intervalRef.current = window.setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            getCharge(payment.id)
              .then(upd => setStatus(upd.data.status))
              .catch(() => {});
            return 30;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [payment, status]);

  if (companyLoading) {
    return (
      <div className={styles.page}>
        <Header onSearch={() => {}} />
        <main className={styles.main}>
          <p>Carregando informações da empresa…</p>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Header onSearch={() => {}} />
      <main className={styles.main}>
        {/* 1) Formulário AsaasCustomer */}
        {!customer ? (
          <section className={styles.formSection}>
            <h1>Configurar PIX (Asaas)</h1>
            {custError && (
              <Notification
                type="error"
                message={custError}
                onClose={() => setCustError(null)}
              />
            )}
            <FloatingLabelInput
              id="asaas-name"
              name="name"
              label="Nome da empresa"
              type="text"
              value={customerInfo.name}
              onChange={e =>
                setCustomerInfo({ ...customerInfo, name: e.target.value })
              }
            />
            <FloatingLabelInput
              id="asaas-email"
              name="email"
              label="E-mail de cobrança"
              type="email"
              value={customerInfo.email}
              onChange={e =>
                setCustomerInfo({ ...customerInfo, email: e.target.value })
              }
            />
            <FloatingLabelInput
              id="asaas-cpf"
              name="cpfCnpj"
              label="CPF ou CNPJ"
              type="text"
              value={customerInfo.cpfCnpj}
              onChange={e =>
                setCustomerInfo({ ...customerInfo, cpfCnpj: e.target.value })
              }
            />
            <FloatingLabelInput
              id="asaas-phone"
              name="phone"
              label="Telefone (opcional)"
              type="text"
              value={customerInfo.phone}
              onChange={e =>
                setCustomerInfo({ ...customerInfo, phone: e.target.value })
              }
            />
            <Button onClick={handleCreateCustomer} disabled={custLoading}>
              {custLoading ? 'Cadastrando…' : 'Autorizar PIX'}
            </Button>
          </section>
        ) : 
        /* 2) Formulário de compra */
        !payment ? (
          <section className={styles.buySection}>
            <h1>Comprar Créditos</h1>
            <p>Valor mínimo de R$ 25,00</p>
            {payError && (
              <Notification
                type="error"
                message={payError}
                onClose={() => setPayError(null)}
              />
            )}
            <FloatingLabelInput
              id="credit-amount"
              name="amount"
              label="Informe o valor (R$)"
              type="text"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
            <Button onClick={handleBuy}>Gerar Cobrança PIX</Button>
          </section>
        ) : (
          /* 3) Status da cobrança */
          <section className={styles.statusSection}>
            <h1>Status da Cobrança</h1>
            <div className={styles.infoRow}>
              <span>ID:</span> <strong>{payment.id}</strong>
            </div>
            <div className={styles.infoRow}>
              <span>Valor:</span> <strong>R$ {payment.amount.toFixed(2)}</strong>
            </div>
            <div className={styles.infoRow}>
              <span>Status:</span>{' '}
              <strong className={styles[status?.toLowerCase() || '']}>
                {status}
              </strong>
            </div>
            {payment.pix_qr_code && (
              <div className={styles.qrContainer}>
                <img
                  src={payment.pix_qr_code}
                  alt="PIX QR Code"
                  className={styles.qr}
                />
              </div>
            )}
            <div className={styles.countdown}>
              Próxima verificação em <strong>{countdown}s</strong>
            </div>
            {status === 'PAID' && (
              <Notification
                type="success"
                message="Pagamento confirmado! Créditos atualizados."
                onClose={() => {}}
              />
            )}
            {(status === 'FAILED' || status === 'CANCELLED') && (
              <Notification
                type="error"
                message="Pagamento não confirmado. Tente novamente."
                onClose={() => {}}
              />
            )}
          </section>
        )}
      </main>
    </div>
  );
}

// src/app/store/cart/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/Header/Header';
import { useCart } from '@/context/CartContext';
import { useAddress } from '@/context/AddressContext';
import ProductDetailModal from '@/components/ProductDetailModal/ProductDetailModal';
import FloatingLabelInput from '@/components/FloatingLabelInput/FloatingLabelInput';
import { getUserPointsBalance } from '@/services/pointsUserService';
import { makeRewardOrder } from '@/services/rewardsService';
import type { RewardOrderCreate } from '@/types/reward';
import { Trash2, Plus, Minus } from 'lucide-react';
import styles from './page.module.css';

export default function CartPage() {
  /* ───────────── context/data ───────────── */
  const {
    items,
    incrementItem,
    decrementItem,
    removeItem,
    clearCart,
    totalPoints,
  } = useCart();

  const {
    addresses,
    selectedAddress,
    loading: loadingAddresses,
    selectAddress,
  } = useAddress();

  const router = useRouter();
  const baseUrl =
    process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';

  /* ───────────── modal de detalhes ───────────── */
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] =
    useState<string | null>(null);

  /* ───────────── saldo de pontos ───────────── */
  const [balance, setBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);

  useEffect(() => {
    getUserPointsBalance()
      .then((res) => setBalance(res.data.balance))
      .catch(() => setBalance(0))
      .finally(() => setLoadingBalance(false));
  }, []);

  const canCheckout = totalPoints <= balance;

  /* ───────────── fluxo de checkout ───────────── */
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [address, setAddress] = useState({
    recipient: '',
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (selectedAddress) {
      setAddress((prev) => ({
        ...prev,
        street: selectedAddress.street || '',
        number: selectedAddress.number || '',
        neighborhood: selectedAddress.neighborhood || '',
        city: selectedAddress.city || '',
        state: selectedAddress.state || '',
        postal_code: selectedAddress.postal_code || '',
        country: selectedAddress.country || '',
      }));
    }
  }, [selectedAddress]);

  /* ───────────── helpers ───────────── */
  const openModal = (id: string) => {
    setSelectedProductId(id);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setSelectedProductId(null);
  };

  const handleStartCheckout = () => {
    setErrorMsg(null);
    setCheckoutOpen(true);
  };

  const handleSelectAddress = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const addr = addresses.find((a) => a.id === e.target.value);
    if (addr) await selectAddress(addr);
  };

  const handleAddressChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) =>
    setAddress((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    const payload: RewardOrderCreate = {
      ...address,
      items: items.map((i) => ({
        product_id: i.id,
        quantity: i.quantity,
      })),
    };

    try {
      await makeRewardOrder(payload);
      clearCart();
      router.push('/store/orders');
    } catch {
      setErrorMsg('Erro ao criar pedido. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ───────────── UI ───────────── */
  return (
    <>
      <Header
        onSearch={(q) =>
          router.push(`/store/search?name=${encodeURIComponent(q)}`)
        }
      />

      <div className={styles.pageWrapper}>
        <div className={styles.container}>
          {/* Saldo */}
          <div className={styles.wallet}>
            {loadingBalance ? (
              <span>Carregando saldo…</span>
            ) : (
              <>
                <span className={styles.walletLabel}>Seu Saldo</span>
                <span className={styles.walletBalance}>
                  {balance.toLocaleString()}pts
                </span>
              </>
            )}
          </div>

          <h4 className={styles.title}>Meu Carrinho</h4>

          {items.length === 0 ? (
            <p className={styles.empty}>Seu carrinho está vazio.</p>
          ) : (
            <>
              <ul className={styles.list}>
                {items.map((item) => (
                  <li key={item.id} className={styles.item}>
                    <div
                      className={styles.imageWrapper}
                      onClick={() => openModal(item.id)}
                    >
                      <Image
                        src={
                          item.image_url
                            ? `${baseUrl}${item.image_url}`
                            : '/placeholder.png'
                        }
                        alt={item.name}
                        width={80}
                        height={80}
                        className={styles.productImage}
                      />
                    </div>

                    <div className={styles.info}>
                      <h2 onClick={() => openModal(item.id)}>{item.name}</h2>

                      <div className={styles.qtyControls}>
                        <button
                          onClick={() => decrementItem(item.id)}
                          className={styles.qtyBtn}
                          disabled={submitting}
                        >
                          <Minus size={14} />
                        </button>
                        <span className={styles.qty}>{item.quantity}</span>
                        <button
                          onClick={() => incrementItem(item.id)}
                          className={styles.qtyBtn}
                          disabled={submitting}
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <p className={styles.price}>
                        {item.points_cost.toLocaleString()}pts cada
                      </p>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className={styles.remove}
                    >
                      <Trash2 size={18} />
                    </button>
                  </li>
                ))}
              </ul>

              {!canCheckout && (
                <p className={styles.warning}>
                  Você não tem pontos suficientes para resgatar esses itens.
                </p>
              )}

              <div className={styles.footer}>
                <p className={styles.total}>
                  Total do Carrinho:{' '}
                  <strong>{totalPoints.toLocaleString()}pts</strong>
                </p>
              </div>

              {canCheckout && !checkoutOpen && (
                <div className={styles.startCheckout}>
                  <button
                    className={styles.checkout}
                    onClick={handleStartCheckout}
                  >
                    Finalizar Resgate
                  </button>
                </div>
              )}

              {checkoutOpen && (
                <form
                  className={styles.checkoutForm}
                  onSubmit={handleSubmitOrder}
                >
                  <h4>Dados de Entrega</h4>
                  {errorMsg && (
                    <p className={styles.errorMsg}>{errorMsg}</p>
                  )}

                  {loadingAddresses ? (
                    <p>Carregando endereços…</p>
                  ) : (
                    addresses.length > 0 && (
                      <div className={styles.formGroup}>
                        <label htmlFor="addressSelect">
                          Escolha o endereço
                        </label>
                        <select
                          id="addressSelect"
                          value={selectedAddress?.id ?? ''}
                          onChange={handleSelectAddress}
                        >
                          {addresses.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.street}, {a.number} – {a.neighborhood} –{' '}
                              {a.city}/{a.state} – CEP {a.postal_code}
                            </option>
                          ))}
                        </select>
                      </div>
                    )
                  )}

                  {/* Destinatário */}
                  <FloatingLabelInput
                    label="Destinatário"
                    id="recipient"
                    name="recipient"
                    value={address.recipient}
                    onChange={handleAddressChange}
                    required
                  />

                  {/* Endereço */}
                  <div className={styles.fieldGroup}>
                    <div className={styles.rowFields}>
                      <FloatingLabelInput
                        label="Rua"
                        id="street"
                        name="street"
                        value={address.street}
                        onChange={handleAddressChange}
                        required
                      />
                      <FloatingLabelInput
                        label="Número"
                        id="number"
                        name="number"
                        value={address.number}
                        onChange={handleAddressChange}
                        required
                      />
                      <FloatingLabelInput
                        label="Bairro"
                        id="neighborhood"
                        name="neighborhood"
                        value={address.neighborhood}
                        onChange={handleAddressChange}
                        required
                      />
                    </div>

                    <FloatingLabelInput
                      label="CEP"
                      id="postal_code"
                      name="postal_code"
                      value={address.postal_code}
                      onChange={handleAddressChange}
                      required
                    />

                    <div className={styles.rowFields}>
                      <FloatingLabelInput
                        label="Cidade"
                        id="city"
                        name="city"
                        value={address.city}
                        onChange={handleAddressChange}
                        required
                      />
                      <FloatingLabelInput
                        label="UF"
                        id="state"
                        name="state"
                        value={address.state}
                        onChange={handleAddressChange}
                        required
                      />
                      <FloatingLabelInput
                        label="País"
                        id="country"
                        name="country"
                        value={address.country}
                        onChange={handleAddressChange}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.formActions}>
                    <button
                      type="button"
                      className={styles.clear}
                      onClick={() => setCheckoutOpen(false)}
                      disabled={submitting}
                    >
                      Voltar
                    </button>

                    {canCheckout && (
                      <button
                        type="submit"
                        className={styles.checkout}
                        disabled={submitting}
                      >
                        {submitting ? 'Enviando…' : 'Confirmar Pedido'}
                      </button>
                    )}
                  </div>
                </form>
              )}
            </>
          )}
        </div>

        {/* Modal */}
        {selectedProductId && (
          <ProductDetailModal
            open={modalOpen}
            onClose={closeModal}
            productId={selectedProductId}
          />
        )}
      </div>
    </>
  );
}

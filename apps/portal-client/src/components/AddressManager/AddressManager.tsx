// src/components/AddressManager/AddressManager.tsx
'use client';

import React, { useState } from 'react';
import { useAddress } from '@/context/AddressContext';
import AddAddressForm from '@/components/AddAddressForm/AddAddressForm';
import Button from '@/components/Button/Button';
import styles from './AddressManager.module.css';

interface AddressManagerProps {
  onClose: () => void;
}

export default function AddressManager({ onClose }: AddressManagerProps) {
  const {
    addresses,
    selectedAddress,
    radiusKm,
    setRadiusKm,
    selectAddress,
    refreshAddresses
  } = useAddress();
  const [isAdding, setIsAdding] = useState(false);

  // Ajuste de raio
  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    if (!isNaN(v)) setRadiusKm(v);
  };

  const handleSelect = async (addrId: string) => {
    if (selectedAddress?.id === addrId) {
      onClose();
      return;
    }
    const addr = addresses.find(a => a.id === addrId);
    if (!addr) return;
    await selectAddress(addr);
    onClose();
  };

  if (isAdding) {
    return (
      <div>
        <h2>Adicionar Endereço</h2>
        <AddAddressForm
          onSuccess={async (newAddr) => {
            await refreshAddresses();
            await selectAddress(newAddr);
            setIsAdding(false);
            onClose();
          }}
        />
        <button className={styles.buttonCancel} onClick={() => setIsAdding(false)}>
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2>Meus Endereços</h2>

      {/* novo input de raio */}
      <div className={styles.radiusInput}>
        <label htmlFor="radiusKm">Raio (km): </label>
        <input
          id="radiusKm"
          type="number"
          min="1"
          step="0.5"
          value={radiusKm}
          onChange={handleRadiusChange}
        />
      </div>

      {addresses.length === 0 ? (
        <p className={styles.loading}>Nenhum endereço cadastrado.</p>
      ) : (
        <ul className={styles.list}>
          {addresses.map(addr => {
            const isSelected = addr.id === selectedAddress?.id;
            return (
              <li key={addr.id}>
                <div className={styles.item}>
                  <div className={styles.info}>
                    {addr.street}, {addr.number}, {addr.neighborhood}, {addr.city}/{addr.state}
                  </div>
                  <button
                    className={`${styles.button} ${
                      isSelected ? styles.buttonSelected : ''
                    }`}
                    onClick={() => handleSelect(addr.id)}
                  >
                    {isSelected ? 'Selecionado' : 'Selecionar'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Button onClick={() => setIsAdding(true)}>+ Adicionar endereço</Button>
    </div>
  );
}

/* File: src/components/AddressManager/AddressManager.tsx */
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
  const [manualMode, setManualMode] = useState(false);

  // Handle slider changes
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setRadiusKm(v);
    if (v < 50 && manualMode) {
      setManualMode(false);
    }
  };

  // Handle manual input changes
  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    if (!isNaN(v)) {
      setRadiusKm(v);
    }
  };

  // Switch to manual mode
  const handlePlusClick = () => {
    setManualMode(true);
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
      <div className={styles.container}>
        <h2 className={styles.title}>Adicionar Endereço</h2>
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
    <div className={styles.container}>
      <h2 className={styles.title}>Meus Endereços</h2>

      {addresses.length === 0 ? (
        <p className={styles.loading}>Nenhum endereço cadastrado.</p>
      ) : (
        <ul className={styles.list}>
          {addresses.map(addr => {
            const isSelected = addr.id === selectedAddress?.id;
            return (
              <React.Fragment key={addr.id}>
                <li className={styles.item}>
                  <div className={styles.info}>
                    {addr.street}, {addr.number}, {addr.neighborhood}, {addr.city}/{addr.state}
                  </div>
                  <button
                    className={`${styles.button} ${isSelected ? styles.buttonSelected : ''}`}
                    onClick={() => handleSelect(addr.id)}
                  >
                    {isSelected ? 'Selecionado' : 'Selecionar'}
                  </button>
                </li>
                {isSelected && (
                  <li className={styles.radiusControlWrapper}>
                    <div className={styles.radiusControl}>
                      {!manualMode ? (
                        <>
                          <input
                            type="range"
                            min={1}
                            max={50}
                            value={Math.min(radiusKm, 50)}
                            onChange={handleSliderChange}
                            className={styles.slider}
                          />
                          <span className={styles.valueLabel}>{radiusKm} km</span>
                          {radiusKm >= 50 && (
                            <button className={styles.manualButton} onClick={handlePlusClick}>
                              +
                            </button>
                          )}
                        </>
                      ) : (
                        <input
                          type="number"
                          min={1}
                          step={0.1}
                          value={radiusKm}
                          onChange={handleManualChange}
                          className={styles.manualInput}
                        />
                      )}
                    </div>
                  </li>
                )}
              </React.Fragment>
            );
          })}
        </ul>
      )}

      <Button onClick={() => setIsAdding(true)}>+ Adicionar endereço</Button>
    </div>
  );
}
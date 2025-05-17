// src/components/AddressManager/AddressManager.tsx
'use client';

import { useEffect, useState } from 'react';
import { listAddresses } from '@/services/addressService';
import type { AddressRead } from '@/types/address';
import { useAddress } from '@/context/AddressContext';
import Modal from '@/components/Modal/Modal';
import AddAddressForm from '@/components/AddAddressForm/AddAddressForm';
import Button from '@/components/Button/Button';
import styles from './AddressManager.module.css';

export default function AddressManager() {
  const { selectedAddress, setSelectedAddress } = useAddress();
  const [addresses, setAddresses] = useState<AddressRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setAddModalOpen] = useState(false);

  useEffect(() => {
    listAddresses()
      .then(res => setAddresses(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2>Meus Endereços</h2>

      <div>
        
      </div>
      {loading ? (
        <p>Carregando…</p>
      ) : addresses.length === 0 ? (
        <p>Nenhum endereço cadastrado.</p>
      ) : (
        <ul className={styles.list}>
          {addresses.map(addr => {
            const isSelected = addr.id === selectedAddress?.id;
            return (
              <li
                key={addr.id}
                className={isSelected ? styles.selected : ''}
              >
                <div className={styles.item}>
                  <div className={styles.info}>
                    {addr.street}, {addr.city} – {addr.state}
                  </div>
                  <button
                    className={`${styles.button} ${isSelected ? styles.buttonSelected : ''}`}
                    onClick={() => setSelectedAddress(addr)}
                    disabled={isSelected}
                    style={{ minWidth: 100 }}
                  >
                    {isSelected ? 'Selecionado' : 'Selecionar'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Button onClick={() => setAddModalOpen(true)}>
        + Adicionar endereço
      </Button>

      <Modal open={isAddModalOpen} onClose={() => setAddModalOpen(false)}>
        <AddAddressForm
          onSuccess={(newAddr) => {
            setAddresses(prev => [...prev, newAddr]);
            setSelectedAddress(newAddr);
            setAddModalOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}

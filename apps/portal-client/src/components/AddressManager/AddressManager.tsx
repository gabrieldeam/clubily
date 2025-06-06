// src/components/AddressManager/AddressManager.tsx
'use client';

import { useEffect, useState } from 'react';
import { listAddresses, updateAddress } from '@/services/addressService'; // <-- import do updateAddress
import type { AddressRead, AddressUpdate } from '@/types/address';
import { useAddress } from '@/context/AddressContext';
import AddAddressForm from '@/components/AddAddressForm/AddAddressForm';
import Button from '@/components/Button/Button';
import styles from './AddressManager.module.css';

export default function AddressManager() {
  const { selectedAddress, setSelectedAddress } = useAddress();
  const [addresses, setAddresses] = useState<AddressRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // 1. Carrega todos os endereços
  useEffect(() => {
    listAddresses()
      .then(res => {
        setAddresses(res.data);
        // Se algum já vier com is_selected, podemos definir no context
        const préSelecionado = res.data.find(a => a.is_selected);
        if (préSelecionado) {
          setSelectedAddress(préSelecionado);
          localStorage.setItem('selectedAddressId', préSelecionado.id);
        }
      })
      .finally(() => setLoading(false));
  }, [setSelectedAddress]);

  // 2. Reidrata selectedAddress a partir do localStorage (somente na primeira carga, se não estiver em modo adicionar)
  useEffect(() => {
    if (loading || isAdding) return;
    const storedId = localStorage.getItem('selectedAddressId');
    if (storedId && !selectedAddress) {
      const found = addresses.find(a => a.id === storedId);
      if (found) {
        setSelectedAddress(found);
      }
    }
  }, [loading, isAdding, addresses, selectedAddress, setSelectedAddress]);

  // Handler para quando o usuário clica em “Selecionar”
  function handleSelect(addr: AddressRead) {
    const prev = selectedAddress;

    // 1) Atualiza imediatamente no front: context + localStorage
    setSelectedAddress(addr);
    localStorage.setItem('selectedAddressId', addr.id);

    // 2) Atualiza lista localmente para refletir is_selected visual
    setAddresses(prevList =>
      prevList.map(a => ({
        ...a,
        is_selected: a.id === addr.id,
      }))
    );

    // 3) Em background, desmarca o anterior e marca o novo
    // Se existia um anterior diferente, desmarcamos
    if (prev && prev.id !== addr.id) {
      const payloadDesmarcar: AddressUpdate = { is_selected: false };
      updateAddress(prev.id, payloadDesmarcar).catch(() => {
        // Ignora erros aqui, ou mostre notificação se quiser
        console.warn(`Falha ao desmarcar endereço ${prev.id}`);
      });
    }

    // Marca o novo como is_selected = true
    const payloadMarcar: AddressUpdate = { is_selected: true };
    updateAddress(addr.id, payloadMarcar).catch(() => {
      console.warn(`Falha ao marcar endereço ${addr.id} como principal`);
    });
  }

  // 3. Se estiver em “modo adicionar”, mostra só o formulário
  if (isAdding) {
    return (
      <div>
        <h2>Adicionar Endereço</h2>

        <AddAddressForm
          onSuccess={(newAddr) => {
            // adiciona o novo endereço na lista, seleciona ele e volta ao modo “listagem”
            setAddresses(prev => [...prev, newAddr]);
            setSelectedAddress(newAddr);
            localStorage.setItem('selectedAddressId', newAddr.id);

            // Como é novo, já podemos marcar diretamente no backend
            const payloadMarcar: AddressUpdate = { is_selected: true };
            updateAddress(newAddr.id, payloadMarcar).catch(() => {
              console.warn(`Falha ao marcar endereço ${newAddr.id} como principal`);
            });

            setIsAdding(false);
          }}
        />

        {/* botão de cancelar para voltar à lista sem salvar nada */}
        <button
          className={styles.buttonCancel}
          onClick={() => setIsAdding(false)}
        >
          Cancelar
        </button>
      </div>
    );
  }

  // 4. Modo “lista de endereços”
  return (
    <div>
      <h2>Meus Endereços</h2>

      {loading ? (
        <p className={styles.loading}>Carregando…</p>
      ) : addresses.length === 0 ? (
        <p className={styles.loading}>Nenhum endereço cadastrado.</p>
      ) : (
        <ul className={styles.list}>
          {addresses.map(addr => {
            const isSelected = addr.id === selectedAddress?.id;

            return (
              <li key={addr.id}>
                <div className={styles.item}>
                  <div className={styles.info}>
                    {addr.street}, {addr.city} – {addr.state}                    
                  </div>
                  <button
                    className={`${styles.button} ${
                      isSelected ? styles.buttonSelected : ''
                    }`}
                    onClick={() => handleSelect(addr)}
                    disabled={isSelected}
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

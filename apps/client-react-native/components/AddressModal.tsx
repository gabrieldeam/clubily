import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { listAddresses } from '../services/addressService';
import type { AddressRead } from '../types/address';
import { useAddress } from '../context/AddressContext';

interface AddressModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AddressModal({ visible, onClose }: AddressModalProps) {
  const { selectedAddress, setSelectedAddress } = useAddress();
  const [addresses, setAddresses] = useState<AddressRead[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    listAddresses()
      .then(res => setAddresses(res.data))
      .catch(() => setAddresses([]))
      .finally(() => setLoading(false));
  }, [visible]);

  const handleSelect = async (addr: AddressRead) => {
    await setSelectedAddress(addr);
    onClose();
  };

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Selecione um endereço</Text>
          {loading ? (
            <ActivityIndicator color="#FFA600" />
          ) : (
            <ScrollView>
              {addresses.map(addr => {
                const isSelected = selectedAddress?.id === addr.id;
                return (
                  <View key={addr.id} style={styles.card}>
                    <Text style={styles.addressText}>
                      {addr.street}, {addr.city} - {addr.state}, {addr.postal_code}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.button,
                        isSelected && styles.buttonSelected,
                      ]}
                      disabled={isSelected}
                      onPress={() => handleSelect(addr)}
                    >
                      <Text style={styles.buttonText}>
                        {isSelected ? 'Selecionado' : 'Selecionar'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          )}
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    maxHeight: '80%',
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressText: {
    flex: 1,
    color: '#000',
  },
  button: {
    backgroundColor: '#FFA600',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  buttonSelected: {
    backgroundColor: '#DDD',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '500',
  },
  closeBtn: {
    marginTop: 8,
    alignSelf: 'center',
  },
  closeText: {
    color: '#FFA600',
    fontSize: 16,
  },
});

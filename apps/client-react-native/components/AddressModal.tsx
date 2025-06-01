import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
} from 'react-native';
import { listAddresses, createAddress, deleteAddress } from '../services/addressService';
import type { AddressRead, AddressCreate } from '../types/address';
import { useAddress } from '../context/AddressContext';

// Import dos componentes customizados
import { Button } from '../components/Button';
import FloatingLabelInput from '../components/FloatingLabelInput';
import Delete from '../assets/icons/delete.svg';

interface AddressModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AddressModal({ visible, onClose }: AddressModalProps) {
  const { selectedAddress, setSelectedAddress } = useAddress();
  const [addresses, setAddresses] = useState<AddressRead[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // NOVOS estados para exclusão
  const [addressToDelete, setAddressToDelete] = useState<AddressRead | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  // Estados do formulário de criação
  const [cep, setCep] = useState('');
  const [cepError, setCepError] = useState('');
  const [street, setStreet] = useState('');
  const [streetError, setStreetError] = useState('');
  const [city, setCity] = useState('');
  const [cityError, setCityError] = useState('');
  const [stateField, setStateField] = useState('');
  const [stateError, setStateError] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('Brasil');
  const [serverError, setServerError] = useState('');

  // Quando o modal abre, carregamos a lista de endereços e resetamos o modo “adding” e “deleting”
  useEffect(() => {
    if (!visible) return;

    setIsAdding(false);
    setAddressToDelete(null);
    setCep('');
    setCepError('');
    setStreet('');
    setStreetError('');
    setCity('');
    setCityError('');
    setStateField('');
    setStateError('');
    setPostalCode('');
    setCountry('Brasil');
    setServerError('');

    setLoading(true);
    listAddresses()
      .then(res => setAddresses(res.data))
      .catch(() => setAddresses([]))
      .finally(() => setLoading(false));
  }, [visible]);

  // Ao clicar em um endereço da lista (selecionar)
  const handleSelect = async (addr: AddressRead) => {
    await setSelectedAddress(addr);
    onClose();
  };

  // Função para buscar via CEP usando a API do ViaCEP
  const fetchAddressFromCep = async (rawCep: string) => {
    const numericCep = rawCep.replace(/\D/g, '');
    if (numericCep.length !== 8) {
      setCepError('Informe um CEP válido com 8 dígitos');
      return;
    }

    try {
      const resp = await fetch(`https://viacep.com.br/ws/${numericCep}/json/`);
      const data = await resp.json();
      if (data.erro) {
        setCepError('CEP não encontrado');
        return;
      }

      // Preencher campos automaticamente e limpar erros
      setStreet(data.logradouro || '');
      setStreetError('');
      setCity(data.localidade || '');
      setCityError('');
      setStateField(data.uf || '');
      setStateError('');
      setPostalCode(data.cep || numericCep);
      setCountry('Brasil');
      setCepError('');
    } catch (err) {
      console.warn('ViaCEP erro:', err);
      setCepError('Falha ao buscar CEP');
    }
  };

  // Validações antes de enviar ao backend (criação)
  const validateFields = (): boolean => {
    let valid = true;
    if (!postalCode.trim()) {
      setCepError('CEP é obrigatório');
      valid = false;
    }
    if (!street.trim()) {
      setStreetError('Rua é obrigatória');
      valid = false;
    }
    if (!city.trim()) {
      setCityError('Cidade é obrigatória');
      valid = false;
    }
    if (!stateField.trim()) {
      setStateError('Estado é obrigatório');
      valid = false;
    }
    return valid;
  };

  // Ao submeter o formulário de criação
  const handleSaveNew = async () => {
    // Limpa erros anteriores
    setCepError('');
    setStreetError('');
    setCityError('');
    setStateError('');
    setServerError('');

    if (!validateFields()) {
      return;
    }

    const payload: AddressCreate = {
      street: street.trim(),
      city: city.trim(),
      state: stateField.trim(),
      postal_code: postalCode.trim(),
      country: country.trim() || 'Brasil',
    };

    try {
      setLoading(true);
      const res = await createAddress(payload);
      const newAddress = res.data;

      // Atualiza a lista local adicionando o novo endereço no topo
      setAddresses(prev => [newAddress, ...prev]);

      // Seleciona automaticamente o novo endereço
      await setSelectedAddress(newAddress);

      // Volta para a listagem e fecha o modal
      setIsAdding(false);
      onClose();
    } catch (err: any) {
      // Se vier erro do backend, exibir mensagem genérica ou específica
      if (err.response?.data?.message) {
        setServerError(err.response.data.message);
      } else {
        setServerError('Erro ao salvar endereço');
      }
      console.error('Erro ao criar endereço:', err);
    } finally {
      setLoading(false);
    }
  };

  // Ao confirmar exclusão
  const handleConfirmDelete = async () => {
    if (!addressToDelete) return;

    try {
      setDeletingLoading(true);
      await deleteAddress(addressToDelete.id);

      // Remove localmente da lista
      setAddresses(prev => prev.filter(a => a.id !== addressToDelete.id));

      // Se o endereço excluído for o selecionado, limpa a seleção
      if (selectedAddress?.id === addressToDelete.id) {
        setSelectedAddress(null);
      }

      // Fecha o modal após exclusão
      setAddressToDelete(null);
      onClose();
    } catch (err) {
      console.error('Erro ao excluir endereço:', err);
      // Você pode exibir uma mensagem de erro aqui, se quiser
    } finally {
      setDeletingLoading(false);
    }
  };

  // Renderiza o ícone de delete ao lado do botão Selecionar / Selecionado
  const renderDeleteIcon = (addr: AddressRead) => (
    <TouchableOpacity
      onPress={() => setAddressToDelete(addr)}
      style={styles.deleteIconContainer}
    >
      <Delete width={20} height={20} />
    </TouchableOpacity>
  );

  // Renderiza o formulário de criação usando FloatingLabelInput
  const renderForm = () => (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Novo Endereço</Text>

        {/* Primeiro campo: CEP */}
        <FloatingLabelInput
          label="CEP"
          value={cep}
          onChangeText={(text) => {
            setCep(text);
            setPostalCode(text);
            setCepError('');
          }}
          onBlur={() => fetchAddressFromCep(cep)}
          keyboardType="numeric"
          returnKeyType="done"
        />
        {cepError ? <Text style={styles.errorText}>{cepError}</Text> : null}

        {/* Logradouro */}
        <FloatingLabelInput
          label="Rua"
          value={street}
          onChangeText={(text) => {
            setStreet(text);
            setStreetError('');
          }}
        />
        {streetError ? <Text style={styles.errorText}>{streetError}</Text> : null}

        {/* Cidade */}
        <FloatingLabelInput
          label="Cidade"
          value={city}
          onChangeText={(text) => {
            setCity(text);
            setCityError('');
          }}
        />
        {cityError ? <Text style={styles.errorText}>{cityError}</Text> : null}

        {/* Estado e País na mesma linha */}
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 15 }}>
            <FloatingLabelInput
              label="Estado"
              value={stateField}
              onChangeText={(text) => {
                setStateField(text);
                setStateError('');
              }}
            />
            {stateError ? <Text style={styles.errorText}>{stateError}</Text> : null}
          </View>
          <View style={{ flex: 1 }}>
            <FloatingLabelInput
              label="País"
              value={country}
              onChangeText={setCountry}
            />
          </View>
        </View>

        {serverError ? <Text style={styles.serverErrorText}>{serverError}</Text> : null}

        {loading ? (
          <ActivityIndicator color="#FFA600" style={{ marginVertical: 12 }} />
        ) : (
          <Button bgColor="#FFA600" onPress={handleSaveNew} disabled={loading}>
            Salvar
          </Button>
        )}

        <TouchableOpacity
          onPress={() => {
            // Volta para a listagem sem salvar e limpa o formulário
            setIsAdding(false);
            setCep('');
            setCepError('');
            setStreet('');
            setStreetError('');
            setCity('');
            setCityError('');
            setStateField('');
            setStateError('');
            setPostalCode('');
            setCountry('Brasil');
            setServerError('');
          }}
          style={[styles.closeBtn, { marginTop: 8 }]}
        >
          <Text style={styles.closeText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );

  // Renderiza a lista de endereços + botão Selecionar e ícone de delete
  const renderList = () => (
    <>
      {loading ? (
        <ActivityIndicator color="#FFA600" style={{ marginVertical: 16 }} />
      ) : (
        <ScrollView>
          {addresses.map(addr => {
            const isSelected = selectedAddress?.id === addr.id;
            return (
              <View key={addr.id} style={styles.card}>
                <Text style={styles.addressText}>
                  {addr.street}, {addr.city} - {addr.state}, {addr.postal_code}
                </Text>
                <View style={styles.buttonsRow}>
                  <TouchableOpacity
                    style={[styles.button, isSelected && styles.buttonSelected]}
                    disabled={isSelected}
                    onPress={() => handleSelect(addr)}
                  >
                    <Text style={styles.buttonText}>
                      {isSelected ? 'Selecionado' : 'Selecionar'}
                    </Text>
                  </TouchableOpacity>
                  {renderDeleteIcon(addr)}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </>
  );

  // Renderiza a confirmação de exclusão
  const renderDeleteConfirmation = () => (
    <View style={styles.confirmContainer}>
      <Text style={styles.confirmText}>Tem certeza?</Text>
      {deletingLoading ? (
        <ActivityIndicator color="#FFA600" style={{ marginVertical: 12 }} />
      ) : (
        <>
          <Button
            bgColor="#FF3B30"
            style={{ marginBottom: 12, width: '60%' }}
            onPress={handleConfirmDelete}
          >
            Excluir Endereço
          </Button>
          <TouchableOpacity
            onPress={() => setAddressToDelete(null)}
            style={styles.closeBtn}
          >
            <Text style={styles.closeText}>Cancelar</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {addressToDelete ? (
            renderDeleteConfirmation()
          ) : isAdding ? (
            renderForm()
          ) : (
            <>
              <Text style={styles.title}>Selecione um endereço</Text>
              {renderList()}
              <Button
                style={styles.addButton}
                bgColor="#FFA600"
                onPress={() => setIsAdding(true)}
                disabled={loading}
              >
                Adicionar Endereço
              </Button>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>Fechar</Text>
              </TouchableOpacity>
            </>
          )}
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
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  addressText: {
    flex: 1,
    color: '#000',
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#FFA600',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  buttonSelected: {
    backgroundColor: '#DDD',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '500',
  },
  deleteIconContainer: {
    marginLeft: 8,
    padding: 6,
  },
  deleteIcon: {
    width: 20,
    height: 20,
  },
  addButton: {
    marginTop: 12,
    marginBottom: 8,
    width: '100%',
  },
  closeBtn: {
    marginTop: 8,
    alignSelf: 'center',
  },
  closeText: {
    color: '#FFA600',
    fontSize: 16,
  },
  formContainer: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 4,
  },
  serverErrorText: {
    color: 'red',
    fontSize: 14,
    marginVertical: 8,
    textAlign: 'center',
  },
  confirmContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 24,
  },
  confirmText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
});

// src/components/AddressModal.tsx

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
  KeyboardAvoidingView,
  Platform,
  InputAccessoryView,
} from 'react-native';
import {
  listAddresses,
  createAddress,
  deleteAddress,
  updateAddress,
} from '../services/addressService';
import type { AddressRead, AddressCreate } from '../types/address';
import { useAddress } from '../context/AddressContext';

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

  // Estados para exclusão
  const [addressToDelete, setAddressToDelete] = useState<AddressRead | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  // Estados do formulário de criação
  const [cep, setCep] = useState('');
  const [cepError, setCepError] = useState('');
  const [street, setStreet] = useState('');
  const [streetError, setStreetError] = useState('');
  const [number, setNumber] = useState('');
  const [numberError, setNumberError] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [neighborhoodError, setNeighborhoodError] = useState('');
  const [complement, setComplement] = useState('');
  const [city, setCity] = useState('');
  const [cityError, setCityError] = useState('');
  const [stateField, setStateField] = useState('');
  const [stateError, setStateError] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('Brasil');
  const [serverError, setServerError] = useState('');

  // Carrega lista de endereços sempre que o modal abre
  useEffect(() => {
    if (!visible) return;

    setIsAdding(false);
    setAddressToDelete(null);
    setServerError('');

    setLoading(true);
    listAddresses()
      .then(res => setAddresses(res.data))
      .catch(() => setAddresses([]))
      .finally(() => setLoading(false));
  }, [visible]);

  // Função para atualizar a lista local, re-fetch dos endereços
  const refreshLocalAddresses = async () => {
    try {
      const res = await listAddresses();
      setAddresses(res.data);
    } catch {
      setAddresses([]);
    }
  };

  // Selecionar endereço
  const handleSelect = async (addr: AddressRead) => {
    // Se já é o mesmo selecionado, apenas fecha
    if (selectedAddress?.id === addr.id) {
      onClose();
      return;
    }

    try {
      setLoading(true);
      // Atualiza contexto e servidor
      await setSelectedAddress(addr);
      // Recarrega lista
      await refreshLocalAddresses();
      onClose();
    } catch (err) {
      console.error('Erro ao atualizar seleção de endereço:', err);
    } finally {
      setLoading(false);
    }
  };

  // Buscar CEP via ViaCEP
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

      setStreet(data.logradouro || '');
      setStreetError('');
      setNeighborhood(data.bairro || '');
      setNeighborhoodError('');
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

  // Validação de campos
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
    if (!number.trim()) {
      setNumberError('Número é obrigatório');
      valid = false;
    }
    if (!neighborhood.trim()) {
      setNeighborhoodError('Bairro é obrigatório');
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

  // Submeter formulário de criação
  const handleSaveNew = async () => {
    setCepError('');
    setStreetError('');
    setNumberError('');
    setNeighborhoodError('');
    setCityError('');
    setStateError('');
    setServerError('');

    if (!validateFields()) {
      return;
    }

    const payload: AddressCreate = {
      street: street.trim(),
      number: number.trim(),
      neighborhood: neighborhood.trim(),
      complement: complement.trim() || undefined,
      city: city.trim(),
      state: stateField.trim(),
      postal_code: postalCode.trim(),
      country: country.trim() || 'Brasil',
      is_selected: false,
    };

    try {
      setLoading(true);
      // 1) Cria novo endereço
      const res = await createAddress(payload);
      const newAddress = res.data;

      // 2) Seleciona o novo através do contexto
      await setSelectedAddress(newAddress);

      // 3) Atualiza lista local
      await refreshLocalAddresses();

      setIsAdding(false);
      onClose();
    } catch (err: any) {
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

  // Confirmar exclusão
  const handleConfirmDelete = async () => {
    if (!addressToDelete) return;

    try {
      setDeletingLoading(true);
      await deleteAddress(addressToDelete.id);
      await refreshLocalAddresses();

      if (selectedAddress?.id === addressToDelete.id) {
        // Se o endereço deletado era o selecionado, limpa contexto
        await setSelectedAddress(null);
      }

      setAddressToDelete(null);
      onClose();
    } catch (err) {
      console.error('Erro ao excluir endereço:', err);
    } finally {
      setDeletingLoading(false);
    }
  };

  // Ícone de delete
  const renderDeleteIcon = (addr: AddressRead) => (
    <TouchableOpacity onPress={() => setAddressToDelete(addr)} style={styles.deleteIconContainer}>
      <Delete width={20} height={20} />
    </TouchableOpacity>
  );

  // Renderiza o formulário de criação
  const renderForm = () => (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.formContent}>
        <Text style={styles.title}>Novo Endereço</Text>

        {Platform.OS === 'ios' && (
          <InputAccessoryView nativeID="inputAccessory">
            <View style={styles.accessoryContainer}>
              <TouchableOpacity onPress={() => Keyboard.dismiss()} style={styles.doneButton}>
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </InputAccessoryView>
        )}

        <FloatingLabelInput
          label="CEP"
          value={cep}
          onChangeText={text => {
            setCep(text);
            setPostalCode(text);
            setCepError('');
          }}
          onBlur={() => fetchAddressFromCep(cep)}
          keyboardType="numeric"
          returnKeyType="done"
          inputAccessoryViewID={Platform.OS === 'ios' ? 'inputAccessory' : undefined}
          onSubmitEditing={Keyboard.dismiss}
        />
        {cepError ? <Text style={styles.errorText}>{cepError}</Text> : null}

        <FloatingLabelInput
          label="Rua"
          value={street}
          onChangeText={text => {
            setStreet(text);
            setStreetError('');
          }}
          returnKeyType="done"
          inputAccessoryViewID={Platform.OS === 'ios' ? 'inputAccessory' : undefined}
          onSubmitEditing={Keyboard.dismiss}
        />
        {streetError ? <Text style={styles.errorText}>{streetError}</Text> : null}

        <View style={styles.row}>
          <View style={styles.col}>
            <FloatingLabelInput
              label="Número"
              value={number}
              onChangeText={text => {
                setNumber(text);
                setNumberError('');
              }}
              keyboardType="numeric"
              returnKeyType="done"
              inputAccessoryViewID={Platform.OS === 'ios' ? 'inputAccessory' : undefined}
              onSubmitEditing={Keyboard.dismiss}
            />
            {numberError ? <Text style={styles.errorText}>{numberError}</Text> : null}
          </View>

          <View style={styles.col}>
            <FloatingLabelInput
              label="Bairro"
              value={neighborhood}
              onChangeText={text => {
                setNeighborhood(text);
                setNeighborhoodError('');
              }}
              returnKeyType="done"
              inputAccessoryViewID={Platform.OS === 'ios' ? 'inputAccessory' : undefined}
              onSubmitEditing={Keyboard.dismiss}
            />
            {neighborhoodError ? <Text style={styles.errorText}>{neighborhoodError}</Text> : null}
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            <FloatingLabelInput
              label="Cidade"
              value={city}
              onChangeText={text => {
                setCity(text);
                setCityError('');
              }}
              returnKeyType="done"
              inputAccessoryViewID={Platform.OS === 'ios' ? 'inputAccessory' : undefined}
              onSubmitEditing={Keyboard.dismiss}
            />
            {cityError ? <Text style={styles.errorText}>{cityError}</Text> : null}
          </View>
          <View style={styles.col}>
            <FloatingLabelInput
              label="Estado"
              value={stateField}
              editable={false}
              inputAccessoryViewID={undefined}
              inputStyle={{ opacity: 0.6 }}
            />
            {stateError ? <Text style={styles.errorText}>{stateError}</Text> : null}
          </View>
        </View>

        <FloatingLabelInput
          label="Complemento (opcional)"
          value={complement}
          onChangeText={setComplement}
          returnKeyType="done"
          inputAccessoryViewID={Platform.OS === 'ios' ? 'inputAccessory' : undefined}
          onSubmitEditing={Keyboard.dismiss}
        />

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
            setIsAdding(false);
            setCep('');
            setCepError('');
            setStreet('');
            setStreetError('');
            setNumber('');
            setNumberError('');
            setNeighborhood('');
            setNeighborhoodError('');
            setComplement('');
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

  // Lista de endereços
  const renderList = () => (
    <>
      {loading ? (
        <ActivityIndicator color="#FFA600" style={{ marginVertical: 16 }} />
      ) : (
        <View style={styles.listContainer}>
          {addresses.map(addr => {
            const isSelected = selectedAddress?.id === addr.id;
            return (
              <View key={addr.id} style={styles.card}>
                <Text style={styles.addressText}>
                  {addr.street}, {addr.number}
                  {addr.neighborhood ? `, ${addr.neighborhood}` : ''}
                  {addr.complement ? `, ${addr.complement}` : ''} - {addr.city} / {addr.state},{' '}
                  {addr.postal_code} - {addr.country}
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
        </View>
      )}
    </>
  );

  // Confirmação de exclusão
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
          <TouchableOpacity onPress={() => setAddressToDelete(null)} style={styles.closeBtn}>
            <Text style={styles.closeText}>Cancelar</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.overlay}>
          <View style={styles.container}>
            <ScrollView
              contentContainerStyle={styles.containerContent}
              keyboardShouldPersistTaps="handled"
            >
              {addressToDelete
                ? renderDeleteConfirmation()
                : isAdding
                ? renderForm()
                : (
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
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  row: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  container: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    width: '100%',
    overflow: 'hidden',
  },
  containerContent: {
    padding: 16,
    flexGrow: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 12,
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
  formContent: {
    width: '100%',
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
  accessoryContainer: {
    backgroundColor: '#f2f2f2',
    borderTopWidth: 1,
    borderColor: '#ddd',
    padding: 8,
    alignItems: 'flex-end',
  },
  doneButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  doneButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

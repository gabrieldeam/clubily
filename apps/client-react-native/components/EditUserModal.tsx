// EditUserModal.tsx
import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  InputAccessoryView,
  Platform,
  KeyboardAvoidingView,
  Alert, // <- import Alert aqui
} from 'react-native';
import { getCurrentUser, updateCurrentUser } from '../services/userService';
import type { UserRead, UserUpdate } from '../types/user';

import { Button } from '../components/Button';
import FloatingLabelInput from '../components/FloatingLabelInput';

interface EditUserModalProps {
  visible: boolean;
  onClose: () => void;
  onUserUpdated?: (updatedUser: UserRead) => void;
}

export default function EditUserModal({
  visible,
  onClose,
  onUserUpdated,
}: EditUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);

  // Estados do formulário de edição
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const [cpf, setCpf] = useState('');
  const [cpfError, setCpfError] = useState('');

  // Quando o modal abre, carregamos os dados do usuário atual
  useEffect(() => {
    if (!visible) return;

    const fetchUserData = async () => {
      setInitialLoading(true);
      setNameError('');
      setEmailError('');
      setPhoneError('');
      setCpfError('');

      try {
        const res = await getCurrentUser();
        const userData = res.data;

        setName(userData.name || '');
        setEmail(userData.email || '');
        setPhone(userData.phone || '');
        setCpf(userData.cpf || '');
      } catch (err) {
        console.error('Erro ao buscar dados do usuário:', err);
        Alert.alert(
          'Erro',
          'Falha ao carregar dados do usuário. Tente novamente mais tarde.'
        );
        setName('');
        setEmail('');
        setPhone('');
        setCpf('');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchUserData();
  }, [visible]);

  // Validações antes de enviar ao backend
  const validateFields = (): boolean => {
    let valid = true;

    if (!name.trim()) {
      setNameError('Nome é obrigatório');
      valid = false;
    }

    if (!email.trim()) {
      setEmailError('Email é obrigatório');
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Email inválido');
      valid = false;
    }

    // Validação de telefone (obrigatório, aceita E.164)
    const onlyDigitsPhone = phone.replace(/\D/g, '');
    if (!onlyDigitsPhone) {
      setPhoneError('Telefone é obrigatório');
      valid = false;
    } else if (onlyDigitsPhone.length < 10) {
      setPhoneError('Telefone inválido');
      valid = false;
    }

    // Validação de CPF (11 dígitos)
    const onlyDigitsCpf = cpf.replace(/\D/g, '');
    if (!onlyDigitsCpf) {
      setCpfError('CPF é obrigatório');
      valid = false;
    } else if (onlyDigitsCpf.length !== 11) {
      setCpfError('CPF deve ter 11 dígitos');
      valid = false;
    }

    return valid;
  };

  // Ao submeter o formulário de edição
  const handleSaveChanges = async () => {
    // Limpa erros anteriores
    setNameError('');
    setEmailError('');
    setPhoneError('');
    setCpfError('');

    if (!validateFields()) {
      return;
    }

    const payload: UserUpdate = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      cpf: cpf.replace(/\D/g, ''),
    };

    try {
      setLoading(true);
      const res = await updateCurrentUser(payload);
      const updatedUser = res.data;

      if (onUserUpdated) {
        onUserUpdated(updatedUser);
      }
      onClose();
    } catch (err: any) {
      // 1) Se o backend retornou "detail" (mensagem simples)
      if (err.response?.data?.detail) {
        Alert.alert('Erro', err.response.data.detail);
      }
      // 2) Se o backend retornou erros específicos de campo em "errors"
      else if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        if (errors.name) setNameError(errors.name.join(', '));
        if (errors.email) setEmailError(errors.email.join(', '));
        if (errors.phone) setPhoneError(errors.phone.join(', '));
        if (errors.cpf) setCpfError(errors.cpf.join(', '));

        // Se não tiver nenhum erro de campo, mando um alerta genérico
        if (
          !errors.name &&
          !errors.email &&
          !errors.phone &&
          !errors.cpf
        ) {
          Alert.alert(
            'Erro',
            'Ocorreu um problema ao atualizar. Verifique os campos e tente novamente.'
          );
        }
      }
      // 3) Qualquer outro tipo de erro (rede, timeout, etc.)
      else {
        Alert.alert(
          'Erro',
          'Não foi possível atualizar. Verifique sua conexão e tente novamente.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Renderiza o formulário de edição
  const renderForm = () => (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Editar Perfil</Text>

        {initialLoading ? (
          <ActivityIndicator
            color="#FFA600"
            style={{ marginVertical: 32 }}
            size="large"
          />
        ) : (
          <>
            {/* Nome */}
            <FloatingLabelInput
              label="Nome Completo"
              value={name}
              onChangeText={(text) => {
                setName(text);
                setNameError('');
              }}
              inputAccessoryViewID={
                Platform.OS === 'ios' ? 'inputAccessory' : undefined
              }
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
            {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

            {/* Email */}
            <FloatingLabelInput
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setEmailError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              inputAccessoryViewID={
                Platform.OS === 'ios' ? 'inputAccessory' : undefined
              }
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

            {/* Telefone */}
            <FloatingLabelInput
              label="Telefone"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                setPhoneError('');
              }}
              keyboardType="phone-pad"
              inputAccessoryViewID={
                Platform.OS === 'ios' ? 'inputAccessory' : undefined
              }
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
            {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}

            {/* CPF */}
            <FloatingLabelInput
              label="CPF"
              value={cpf}
              onChangeText={(text) => {
                setCpf(text);
                setCpfError('');
              }}
              keyboardType="numeric"
              maxLength={14}
              inputAccessoryViewID={
                Platform.OS === 'ios' ? 'inputAccessory' : undefined
              }
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
            {cpfError ? <Text style={styles.errorText}>{cpfError}</Text> : null}

            {loading ? (
              <ActivityIndicator color="#FFA600" style={{ marginVertical: 12 }} />
            ) : (
              <Button bgColor="#FFA600" onPress={handleSaveChanges} disabled={loading}>
                Salvar Alterações
              </Button>
            )}

            <TouchableOpacity
              onPress={() => {
                onClose();
              }}
              style={[styles.closeBtn, { marginTop: 8 }]}
              disabled={loading}
            >
              <Text style={styles.closeText}>Cancelar</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </TouchableWithoutFeedback>
  );

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      {/* KeyboardAvoidingView para subir o conteúdo em 50 quando o teclado abrir */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.overlay}>
          <View style={styles.container}>{renderForm()}</View>

          {/* InputAccessoryView (iOS) */}
          {Platform.OS === 'ios' && (
            <InputAccessoryView nativeID="inputAccessory">
              <View style={styles.accessoryContainer}>
                <TouchableOpacity
                  onPress={() => Keyboard.dismiss()}
                  style={styles.doneButton}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </InputAccessoryView>
          )}
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
  container: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    maxHeight: '90%',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  formContainer: {
    // Herdado do container
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 4,
  },
  closeBtn: {
    marginTop: 8,
    alignSelf: 'center',
  },
  closeText: {
    color: '#FFA600',
    fontSize: 16,
  },

  /* Estilos do InputAccessoryView */
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

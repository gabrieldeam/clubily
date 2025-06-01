// EditUserModal.tsx
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
} from 'react-native';
import { getCurrentUser, updateCurrentUser } from '../services/userService'; // Supondo que seus serviços de usuário estejam aqui
import type { UserRead, UserUpdate } from '../types/user'; // Supondo que seus tipos de usuário estejam aqui

// Import dos componentes customizados
import { Button } from '../components/Button';
import FloatingLabelInput from '../components/FloatingLabelInput';

interface EditUserModalProps {
  visible: boolean;
  onClose: () => void;
  onUserUpdated?: (updatedUser: UserRead) => void; // Callback opcional para quando o usuário for atualizado
}

export default function EditUserModal({ visible, onClose, onUserUpdated }: EditUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false); // Loading para busca inicial do usuário

  // Estados do formulário de edição
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState(''); // Opcional, mas pode ser útil
  const [serverError, setServerError] = useState('');

  // Quando o modal abre, carregamos os dados do usuário atual
  useEffect(() => {
    if (!visible) return;

    const fetchUserData = async () => {
      setInitialLoading(true);
      setServerError('');
      setNameError('');
      setEmailError('');
      setPhoneError('');
      try {
        const res = await getCurrentUser();
        const userData = res.data;
        setName(userData.name || '');
        setEmail(userData.email || '');
        setPhone(userData.phone || '');
      } catch (err) {
        console.error('Erro ao buscar dados do usuário:', err);
        setServerError('Falha ao carregar dados do usuário.');
        // Limpar campos em caso de erro para não mostrar dados antigos
        setName('');
        setEmail('');
        setPhone('');
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
    } else if (!/\S+@\S+\.\S+/.test(email)) { // Validação simples de email
      setEmailError('Email inválido');
      valid = false;
    }
    // Adicionar validação de telefone se necessário
    // Ex: if (phone.trim() && !/^\d{10,11}$/.test(phone.replace(/\D/g, ''))) {
    //   setPhoneError('Telefone inválido');
    //   valid = false;
    // }
    return valid;
  };

  // Ao submeter o formulário de edição
  const handleSaveChanges = async () => {
    // Limpa erros anteriores
    setNameError('');
    setEmailError('');
    setPhoneError('');
    setServerError('');

    if (!validateFields()) {
      return;
    }

    const payload: UserUpdate = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined, // Envia undefined se vazio para não limpar no backend se não for intenção
    };

    try {
      setLoading(true);
      const res = await updateCurrentUser(payload);
      const updatedUser = res.data;

      if (onUserUpdated) {
        onUserUpdated(updatedUser);
      }
      onClose(); // Fecha o modal após o sucesso
    } catch (err: any) {
      if (err.response?.data?.message) {
        setServerError(err.response.data.message);
      } else if (err.response?.data?.errors) {
        // Se o backend retornar erros específicos por campo
        const errors = err.response.data.errors;
        if (errors.name) setNameError(errors.name.join(', '));
        if (errors.email) setEmailError(errors.email.join(', '));
        if (errors.phone) setPhoneError(errors.phone.join(', '));
        if (!errors.name && !errors.email && !errors.phone) {
            setServerError('Erro ao atualizar usuário. Verifique os campos.');
        }
      }
      else {
        setServerError('Erro ao atualizar usuário.');
      }
      console.error('Erro ao atualizar usuário:', err);
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
          <ActivityIndicator color="#FFA600" style={{ marginVertical: 32 }} size="large" />
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
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

            {/* Telefone */}
            <FloatingLabelInput
              label="Telefone (Opcional)"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                setPhoneError('');
              }}
              keyboardType="phone-pad"
            />
            {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}

            {serverError ? <Text style={styles.serverErrorText}>{serverError}</Text> : null}

            {loading ? (
              <ActivityIndicator color="#FFA600" style={{ marginVertical: 12 }} />
            ) : (
              <Button bgColor="#FFA600" onPress={handleSaveChanges} disabled={loading}>
                Salvar Alterações
              </Button>
            )}

            <TouchableOpacity
              onPress={() => {
                onClose(); // Apenas fecha, os dados serão recarregados na próxima abertura
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
      <View style={styles.overlay}>
        <View style={styles.container}>
          {renderForm()}
        </View>
      </View>
    </Modal>
  );
}

// Você pode reutilizar os estilos da AddressModal ou ajustá-los conforme necessário
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
    maxHeight: '90%', // Aumentar um pouco se necessário para o formulário
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16, // Aumentar um pouco o espaçamento
    textAlign: 'center',
  },
  formContainer: {
    // Espaçamento herdado do container
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
  closeBtn: {
    marginTop: 8,
    alignSelf: 'center',
  },
  closeText: {
    color: '#FFA600',
    fontSize: 16,
  },
  // Adicione ou ajuste estilos conforme necessário
});
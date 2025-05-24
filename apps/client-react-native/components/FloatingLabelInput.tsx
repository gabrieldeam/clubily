// apps/client-react-native/components/FloatingLabelInput.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  TextInput,
  Animated,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from 'react-native';
// Expo já traz @expo/vector-icons que inclui Feather
import { Feather } from '@expo/vector-icons';

interface FloatingLabelInputProps extends TextInputProps {
  label: string;
  /** Estilo extra para o contêiner */
  containerStyle?: object;
  /** Estilo extra para o TextInput */
  inputStyle?: object;
}

/**
 * TextInput com label flutuante e botão de revelar senha (quando type="password").
 * Para usar:
 * <FloatingLabelInput
 *   label="Email ou telefone"
 *   value={value}
 *   onChangeText={setValue}
 * />
 */
export default function FloatingLabelInput({
  label,
  value,
  onFocus,
  onBlur,
  containerStyle,
  inputStyle,
  secureTextEntry,
  ...rest
}: FloatingLabelInputProps) {
  // Estado de foco + exibição da senha
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // animação do label (0 = dentro, 1 = flutuante)
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  // Quando valor externo muda (via prop) anima
  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const handleFocus = (e: any) => {
    setFocused(true);
    Animated.timing(anim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: false,
    }).start();
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setFocused(false);
    if (!value) {
      Animated.timing(anim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }).start();
    }
    onBlur?.(e);
  };

  const isPassword = secureTextEntry === true;
  const actualSecure = isPassword && !showPassword;

  return (
    <View style={[styles.container, containerStyle]}>
      {/* LABEL */}
      <Animated.Text
        style={[
          styles.label,
          {
            // move de 18 -> -6
            top: anim.interpolate({ inputRange: [0, 1], outputRange: [18, -8] }),
            fontSize: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 12] }),
            color: focused ? '#000' : '#777',
          },
        ]}
        pointerEvents="none"
      >
        {label}
      </Animated.Text>

      {/* INPUT */}
      <TextInput
        style={[styles.input, inputStyle]}
        value={value}
        onFocus={handleFocus}
        onBlur={handleBlur}
        secureTextEntry={actualSecure}
        {...rest}
      />

      {/* TOGGLE senha */}
      {isPassword && (
        <TouchableOpacity
          style={styles.toggle}
          onPress={() => setShowPassword((prev) => !prev)}
          activeOpacity={0.7}
        >
          <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    position: 'relative',
  },
  input: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingRight: 40, 
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 8,
    backgroundColor: 'transparent',
    minHeight: 60,
  },
  label: {
    position: 'absolute',
    left: 16,
    backgroundColor: '#FFF',
    paddingHorizontal: 4,
    zIndex: 1,
  },
  toggle: {
    position: 'absolute',
    right: 12,
    top: '50%',
    backgroundColor: '#FFF',
    transform: [{ translateY: -10 }],
  },
});

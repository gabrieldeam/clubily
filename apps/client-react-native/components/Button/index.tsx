// components/Button/index.tsx
import React, { ReactNode } from 'react';
import {
  TouchableOpacity,
  Text,
  GestureResponderEvent,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { styles } from './styles';

interface ButtonProps {
  children: ReactNode;
  onPress?: (e: GestureResponderEvent) => void;
  disabled?: boolean;
  bgColor?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Button({
  children,
  onPress,
  disabled = false,
  bgColor,
  style,
  textStyle,
}: ButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        bgColor ? { backgroundColor: bgColor } : {},
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.label, textStyle]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}

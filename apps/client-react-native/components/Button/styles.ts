// components/Button/styles.ts
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  button: {
    padding: 25,
    width: '100%',
    borderRadius: 10,
    backgroundColor: '#FF4C00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#FFF',
    fontSize: 16,
  },
  disabled: {
    opacity: 0.6,
  },
});

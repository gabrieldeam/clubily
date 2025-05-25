// apps/client-react-native/app/(private)/_layout.tsx
import React from 'react';
import { Slot } from 'expo-router';
import FloatingMenu from '../../components/FloatingMenu';

export default function PrivateLayout() {
  return (
    <>
      <Slot />          
      <FloatingMenu /> 
    </>
  );
}

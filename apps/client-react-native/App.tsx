// App.tsx
import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { AddressProvider } from './context/AddressContext';
import { Stack } from 'expo-router';

export default function App() {
  return (
    <AuthProvider>
      <AddressProvider>
        <Stack />
      </AddressProvider>
    </AuthProvider>
  );
}

// src/screens/StoresScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function StoresScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Stores</Text>
      <Text>List of stores the user follows or has visited.</Text>
      {/* Placeholder for store list */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});


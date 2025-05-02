// src/screens/AuthScreen.tsx
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase/client'; // Adjust path if needed

export default function AuthScreen() {
  // Placeholder for Supabase UI or custom login form
  const handleLogin = async () => {
    // Example login - replace with actual implementation
    const { error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com', // Replace with input values
      password: 'password',      // Replace with input values
    });
    if (error) alert(error.message);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login / Sign Up</Text>
      {/* Add Supabase Auth UI or custom form inputs here */}
      <Button title="Simulate Login" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});


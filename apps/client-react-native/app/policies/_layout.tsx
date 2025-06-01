// apps/client-react-native/app/policies/_layout.tsx
import { Stack } from 'expo-router';

export default function PoliciesLayout() {
  return (
    <Stack screenOptions={{
      headerShown: true,
      headerTitleAlign: 'center', 
      headerStyle: {
        backgroundColor: '#FFA600',         
      },
      headerTintColor: '#FFF', 
    }}>
      <Stack.Screen name="privacy" options={{ title: 'Política de Privacidade' }} />
      <Stack.Screen name="terms" options={{ title: 'Termos de Uso' }} />
    </Stack>
  );
}
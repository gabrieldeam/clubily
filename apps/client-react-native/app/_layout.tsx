// apps/client-react-native/app/_layout.tsx
import { useEffect } from 'react';
import { Slot, useRouter, usePathname } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { AddressProvider } from '../context/AddressContext';

function Inner() {
  const router = useRouter();
  const pathname = usePathname();      
  const { user, loading } = useAuth(); 

  useEffect(() => {
    if (loading) return;       

    if (user && pathname !== '/home') {
      router.replace('/home');
      return;
    }

    if (!user && pathname !== '/') {
      router.replace('/');
    }
  }, [user, loading, pathname, router]);

  return <Slot />;
}

export default function Layout() {
  return (
    <AuthProvider>
        <AddressProvider>
            <Inner />
        </AddressProvider>
    </AuthProvider>
  );
}

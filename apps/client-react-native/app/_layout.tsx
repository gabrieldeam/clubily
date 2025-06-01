// apps/client-react-native/app/_layout.tsx
import { useEffect } from 'react';
import { Slot, useRouter, usePathname } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { AddressProvider } from '../context/AddressContext';

function Inner() {
  const router    = useRouter();
  const pathname  = usePathname();          // ex: '/profile'
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    const publicPaths  = ['/'];
    const privatePaths = ['/home', '/profile', '/companies/[id]', '/companies', '/categories', '/search', '/all-companies'];

    if (user) {
      // logado mas em rota pública? → manda pra /home
      if (publicPaths.includes(pathname)) router.replace('/home');
    } else {
      // não logado e em rota privada? → manda pra /
      if (privatePaths.includes(pathname)) router.replace('/');
    }
  }, [loading, user, pathname]);

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

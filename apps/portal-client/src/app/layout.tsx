// app/layout.tsx
'use client';

import './globals.css';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/context/AuthContext';
import { AddressProvider } from '@/context/AddressContext';
import FloatingMenu from '@/components/FloatingMenu/FloatingMenu';
import { CartProvider } from '@/context/CartContext';
import 'leaflet/dist/leaflet.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const path = usePathname();
  const isAdmin = path?.startsWith('/admin');

  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          <AddressProvider>
             <CartProvider>
              {/* Só exibe o FloatingMenu quando NÃO estivermos em /admin */}
              {!isAdmin && <FloatingMenu />}
              {children}
             </CartProvider>            
          </AddressProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

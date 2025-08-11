'use client'

import { usePathname } from 'next/navigation'
import { AuthProvider } from '@/context/AuthContext'
import { AddressProvider } from '@/context/AddressContext'
import { CartProvider } from '@/context/CartContext'
import FloatingMenu from '@/components/FloatingMenu/FloatingMenu'

export function Providers({ children }: { children: React.ReactNode }) {
  const path = usePathname()

  // o menu NÃO aparece em /admin/** e /link/**
  const hideMenu =
    path === '/admin' ||
    path?.startsWith('/admin/') ||
    path === '/link' ||
    path?.startsWith('/link/')

  return (
    <AuthProvider>
      <AddressProvider>
        <CartProvider>
          {!hideMenu && <FloatingMenu />}
          {children}
        </CartProvider>
      </AddressProvider>
    </AuthProvider>
  )
}

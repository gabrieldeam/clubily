'use client'

import { usePathname } from 'next/navigation'
import { AuthProvider } from '@/context/AuthContext'
import { AddressProvider } from '@/context/AddressContext'
import { CartProvider } from '@/context/CartContext'
import FloatingMenu from '@/components/FloatingMenu/FloatingMenu'

export function Providers({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const isAdmin = path?.startsWith('/admin')

  return (
    <AuthProvider>
      <AddressProvider>
        <CartProvider>
          {!isAdmin && <FloatingMenu />}
          {children}
        </CartProvider>
      </AddressProvider>
    </AuthProvider>
  )
}

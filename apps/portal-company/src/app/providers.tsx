// app/providers.tsx
'use client'

import { usePathname } from 'next/navigation'
import { AuthProvider } from '@/context/AuthContext'
import { WalletProvider } from '@/context/WalletContext'
import FloatingMenu from '@/components/FloatingMenu/FloatingMenu'

const HIDE_MENU_ON = ['/points', '/credits', '/register']

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hideMenu = HIDE_MENU_ON.some(
    (base) => pathname === base || pathname?.startsWith(`${base}/`)
  )

  return (
    <AuthProvider>
      <WalletProvider>
        {!hideMenu && <FloatingMenu />}
        {children}
      </WalletProvider>
    </AuthProvider>
  )
}

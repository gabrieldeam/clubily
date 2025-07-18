// app/providers.tsx
'use client'

import { AuthProvider } from '@/context/AuthContext'
import { WalletProvider } from '@/context/WalletContext'
import FloatingMenu from '@/components/FloatingMenu/FloatingMenu'

export function Providers({ children }: { children: React.ReactNode }) {

  return (
    <AuthProvider>
      <WalletProvider>
        <FloatingMenu />
        {children}
      </WalletProvider>
    </AuthProvider>
  )
}

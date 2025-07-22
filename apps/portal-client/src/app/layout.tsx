// app/layout.tsx
import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Clubily',
  description: 'Clubily — seu programa de fidelidade',
  icons: {
    icon: '/icon.svg',       
    shortcut: '/icon.svg',   
    apple: '/icon.svg',      
  },
}

export const viewport: Viewport = {
  themeColor: '#FFA600',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}

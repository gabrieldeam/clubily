// app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Clubily',
  description: 'Clubily — seu programa de fidelidade',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFA600' },
    { media: '(prefers-color-scheme: dark)',  color: '#FFA600' },
  ],
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
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

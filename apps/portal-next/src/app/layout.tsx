// src/app/layout.tsx
import { Inter } from 'next/font/google'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import SupabaseProvider from './supabase-provider'
import type { Metadata } from 'next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Loyalty Merchant Portal',
  description: 'Manage your loyalty campaigns and customers',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // ① Leia o cookie store SINCRO: cookies() devolve ReadonlyRequestCookies
  const cookieStore = await cookies()

  // ② Crie o client SSR passando apenas o cookieStore (só leitura)
  const supabaseServer = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieStore }
  )

  // ③ Busque a sessão (isso casa o markup SSR com o CSR)
  const {
    data: { session },
  } = await supabaseServer.auth.getSession()

  return (
    <html lang="en">
      <body suppressHydrationWarning className={inter.className}>
        <SupabaseProvider serverSession={session}>
          {children}
        </SupabaseProvider>
      </body>
    </html>
  )
}

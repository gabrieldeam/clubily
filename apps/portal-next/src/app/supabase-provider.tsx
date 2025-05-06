// src/app/supabase-provider.tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { createContext, useContext, useEffect, useState } from 'react'
import type { Session, SupabaseClient } from '@supabase/supabase-js'

type SupabaseContextType = {
  supabase: SupabaseClient
  session: Session | null
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(
  undefined
)

export default function SupabaseProvider({
  serverSession,
  children,
}: {
  serverSession: Session | null
  children: React.ReactNode
}) {
  const [supabase] = useState(() => createClient())
  const [session, setSession] = useState<Session | null>(serverSession)

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_, newSession) => {
      setSession(newSession)
    })
    return () => data.subscription.unsubscribe()
  }, [supabase])

  return (
    <SupabaseContext.Provider value={{ supabase, session }}>
      {children}
    </SupabaseContext.Provider>
  )
}

export const useSupabase = () => {
  const ctx = useContext(SupabaseContext)
  if (!ctx) throw new Error('useSupabase must be used within SupabaseProvider')
  return ctx
}

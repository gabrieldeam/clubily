// src/context/AuthContext.tsx
'use client'

import React, { createContext, useState, useEffect, useContext } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/services/api'
import { getCurrentCompany, logoutCompany } from '@/services/companyService'
import type { CompanyRead } from '@/types/company'

interface AuthContextType {
  user: CompanyRead | null
  loading: boolean
  refreshUser: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
  logout: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CompanyRead | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const refreshUser = async () => {
    setLoading(true)
    try {
      const res = await getCurrentCompany()
      setUser(res.data)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await logoutCompany()
    } catch {
      // ignore
    } finally {
      setUser(null)
      router.replace('/')
    }
  }

  useEffect(() => {
    // instala interceptor UMA SÓ vez
    const id = api.interceptors.response.use(
      resp => resp,
      err => {
        const status = err.response?.status
        const url = err.config?.url || ''

        // ignora 401 na própria rota de login ou no refresh de perfil
        if (
          status === 401 &&
          !url.includes('/companies/login') &&
          !url.includes('/companies/me')
        ) {
          logout()
        }
        return Promise.reject(err)
      }
    )
    return () => {
      api.interceptors.response.eject(id)
    }
  }, []) // router dentro de deps poderá reinstalar interceptor desnecessariamente

  useEffect(() => {
    refreshUser()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

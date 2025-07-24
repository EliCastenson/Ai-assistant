import { useState, useEffect, createContext, useContext } from 'react'
import { api } from '../lib/api'

interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  timezone: string
  language: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored token and validate
    const token = localStorage.getItem('auth_token')
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      validateToken()
    } else {
      setLoading(false)
    }
  }, [])

  const validateToken = async () => {
    try {
      const response = await api.get('/api/auth/me')
      setUser(response.data)
    } catch (error) {
      localStorage.removeItem('auth_token')
      delete api.defaults.headers.common['Authorization']
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string) => {
    try {
      const response = await api.post('/api/auth/login', { email })
      const { access_token, ...userData } = response.data
      
      localStorage.setItem('auth_token', access_token)
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      setUser(userData)
    } catch (error) {
      throw new Error('Login failed')
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 

// useDarkMode.ts
import { useEffect, useState, useCallback } from 'react'

const DARK_MODE_KEY = 'darkModePreference'

function getSystemPreference() {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  return false
}

export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem(DARK_MODE_KEY)
    if (stored !== null) return stored === 'dark'
    return getSystemPreference()
  })

  // Apply or remove the 'dark' class on <html>
  useEffect(() => {
    const root = window.document.documentElement
    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [isDark])

  // Listen to system preference changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      if (localStorage.getItem(DARK_MODE_KEY) === null) {
        setIsDark(e.matches)
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Manual toggle
  const toggleDark = useCallback(() => {
    setIsDark(prev => {
      const next = !prev
      localStorage.setItem(DARK_MODE_KEY, next ? 'dark' : 'light')
      return next
    })
  }, [])

  // Allow resetting to system preference
  const resetToSystem = useCallback(() => {
    localStorage.removeItem(DARK_MODE_KEY)
    setIsDark(getSystemPreference())
  }, [])

  return { isDark, toggleDark, resetToSystem }
} 
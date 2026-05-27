'use client'

import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/supabase/types'

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  initialized: boolean
}

type AuthAction =
  | { type: 'SET_USER'; user: User | null; profile: Profile | null }
  | { type: 'SET_PROFILE'; profile: Profile }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'INITIALIZED' }
  | { type: 'LOGOUT' }

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.user, profile: action.profile, loading: false, initialized: true }
    case 'SET_PROFILE':
      return { ...state, profile: action.profile }
    case 'SET_LOADING':
      return { ...state, loading: action.loading }
    case 'INITIALIZED':
      return { ...state, initialized: true, loading: false }
    case 'LOGOUT':
      return { user: null, profile: null, loading: false, initialized: true }
    default:
      return state
  }
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    profile: null,
    loading: true,
    initialized: false,
  })

  const supabase = getSupabaseClient()

  async function fetchProfile(userId: string): Promise<Profile | null> {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return data
  }

  async function refreshProfile() {
    if (!state.user) return
    const profile = await fetchProfile(state.user.id)
    if (profile) dispatch({ type: 'SET_PROFILE', profile })
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id)
        dispatch({ type: 'SET_USER', user: session.user, profile })
      } else {
        dispatch({ type: 'INITIALIZED' })
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await fetchProfile(session.user.id)
        dispatch({ type: 'SET_USER', user: session.user, profile })
      } else if (event === 'SIGNED_OUT') {
        dispatch({ type: 'LOGOUT' })
      } else if (event === 'USER_UPDATED' && session?.user) {
        const profile = await fetchProfile(session.user.id)
        dispatch({ type: 'SET_USER', user: session.user, profile })
      }
    })

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function signIn(email: string, password: string) {
    dispatch({ type: 'SET_LOADING', loading: true })
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      dispatch({ type: 'SET_LOADING', loading: false })
      return { error: error.message }
    }
    return { error: null }
  }

  async function signInWithMagicLink(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    return { error: error?.message ?? null }
  }

  async function signOut() {
    await supabase.auth.signOut()
    dispatch({ type: 'LOGOUT' })
  }

  return (
    <AuthContext.Provider value={{ ...state, signIn, signInWithMagicLink, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

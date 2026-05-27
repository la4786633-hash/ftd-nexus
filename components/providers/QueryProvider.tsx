'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, type ReactNode, useEffect, useRef } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuth } from './AuthProvider'
import { useQueryClient } from '@tanstack/react-query'

// ============================================================
// QUERY PROVIDER
// ============================================================

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: (failureCount, error: any) => {
              if (error?.status === 401 || error?.status === 403) return false
              return failureCount < 2
            },
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}

// ============================================================
// REALTIME PROVIDER
// ============================================================

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const supabase = getSupabaseClient()
  const channelRef = useRef<any>(null)

  useEffect(() => {
    if (!profile?.grupo_id) return

    // Unsubscribe from previous
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase.channel(`grupo:${profile.grupo_id}`)

    // Scoreboard changes
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'scoreboard_semanas', filter: `grupo_id=eq.${profile.grupo_id}` },
      () => {
        queryClient.invalidateQueries({ queryKey: ['scoreboard'] })
        queryClient.invalidateQueries({ queryKey: ['team-scoreboard'] })
        queryClient.invalidateQueries({ queryKey: ['team-dashboard'] })
      }
    )

    // WIG changes
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'wigs', filter: `grupo_id=eq.${profile.grupo_id}` },
      () => {
        queryClient.invalidateQueries({ queryKey: ['wigs'] })
        queryClient.invalidateQueries({ queryKey: ['wig-active'] })
        queryClient.invalidateQueries({ queryKey: ['team-dashboard'] })
      }
    )

    // Pipeline changes
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'cobra_oportunidades', filter: `grupo_id=eq.${profile.grupo_id}` },
      () => {
        queryClient.invalidateQueries({ queryKey: ['pipeline-kanban'] })
        queryClient.invalidateQueries({ queryKey: ['pipeline-funnel'] })
      }
    )

    // Cadencia changes
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'cadencia_compromissos' },
      () => queryClient.invalidateQueries({ queryKey: ['cadencias'] })
    )

    // Notifications (personal)
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
      (payload) => {
        queryClient.invalidateQueries({ queryKey: ['notifications', profile.id] })
        // Could also show a toast here
      }
    )

    channel.subscribe()
    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.grupo_id, profile?.id])

  return <>{children}</>
}

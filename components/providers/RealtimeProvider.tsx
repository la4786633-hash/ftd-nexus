// ============================================================
// FTD NEXUS — RealtimeProvider
// Supabase Realtime subscriptions for live sync
// ============================================================

'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import { toast } from 'sonner'
import type { Notification } from '@/lib/supabase/types'

const TOAST_ICONS: Record<string, string> = {
  alerta_placar: '🔴',
  cadencia_pendente: '📅',
  cobra_liberado: '🎯',
  meta_atingida: '🏆',
  risco_mci: '⚠️',
  compromisso: '✅',
  sistema: 'ℹ️',
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const supabase = getSupabaseClient()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!profile?.grupo_id || !profile?.id) return

    // Clean up previous subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabase.channel(`nexus:grupo:${profile.grupo_id}`)

    // ---- D3 Scoreboard ----
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'scoreboard_semanas',
        filter: `grupo_id=eq.${profile.grupo_id}`,
      },
      () => {
        queryClient.invalidateQueries({ queryKey: ['scoreboard'] })
        queryClient.invalidateQueries({ queryKey: ['team-scoreboard'] })
        queryClient.invalidateQueries({ queryKey: ['team-dashboard'] })
      }
    )

    // ---- WIGs ----
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'wigs',
        filter: `grupo_id=eq.${profile.grupo_id}`,
      },
      () => {
        queryClient.invalidateQueries({ queryKey: ['wigs'] })
        queryClient.invalidateQueries({ queryKey: ['wig-active'] })
        queryClient.invalidateQueries({ queryKey: ['team-dashboard'] })
      }
    )

    // ---- Lead Measures ----
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'lead_registros',
      },
      () => {
        queryClient.invalidateQueries({ queryKey: ['leads'] })
        queryClient.invalidateQueries({ queryKey: ['team-dashboard'] })
      }
    )

    // ---- COBRA Pipeline ----
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'cobra_oportunidades',
        filter: `grupo_id=eq.${profile.grupo_id}`,
      },
      () => {
        queryClient.invalidateQueries({ queryKey: ['pipeline-kanban'] })
        queryClient.invalidateQueries({ queryKey: ['pipeline-funnel'] })
        queryClient.invalidateQueries({ queryKey: ['cobra-summary'] })
      }
    )

    // ---- Cadência Compromissos ----
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'cadencia_compromissos',
      },
      () => {
        queryClient.invalidateQueries({ queryKey: ['cadencias'] })
        queryClient.invalidateQueries({ queryKey: ['cadencia-upcoming'] })
      }
    )

    // ---- COBRA Avaliações ----
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'cobra_avaliacoes',
        filter: `grupo_id=eq.${profile.grupo_id}`,
      },
      () => {
        queryClient.invalidateQueries({ queryKey: ['cobra-avaliacoes'] })
        queryClient.invalidateQueries({ queryKey: ['cobra-latest-avaliacao'] })
      }
    )

    // ---- Notifications (personal) ----
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${profile.id}`,
      },
      (payload) => {
        queryClient.invalidateQueries({ queryKey: ['notifications', profile.id] })

        // Show toast for new notifications
        const notif = payload.new as Notification
        if (notif?.titulo) {
          const icon = TOAST_ICONS[notif.tipo] ?? 'ℹ️'
          toast(notif.titulo, {
            description: notif.mensagem ?? undefined,
            icon,
            duration: 6000,
          })
        }
      }
    )

    // ---- Profiles (team changes) ----
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `grupo_id=eq.${profile.grupo_id}`,
      },
      () => {
        queryClient.invalidateQueries({ queryKey: ['team'] })
      }
    )

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.debug('[Realtime] Connected to grupo channel:', profile.grupo_id)
      }
      if (status === 'CHANNEL_ERROR') {
        console.warn('[Realtime] Channel error for grupo:', profile.grupo_id)
      }
    })

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
